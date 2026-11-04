---
title: The job queue I built three times
description: Redis, then Go channels, then a Postgres table. Why a solo SaaS deleted a service, what the in-memory queue lost on every deploy, and why the plan to move to SQS lost to a table it already had.
published: 2026-11-04
project: tracktions
concerns: [failure, cost]
---

Tracktions is a trading journal. Its users upload broker tradebooks or connect a broker, and
the system turns raw fills into round-trip trades and analytics. An import isn't a
request-and-response operation. It parses thousands of rows, rebuilds trades and recomputes
numbers that depend on the whole history, and it takes long enough that the user will reload
the page in the middle of it.

So it runs as a background job. In two years the queue behind those jobs has been rebuilt
twice, and each version was right for what I knew at the time. This is what each one cost,
and what made me replace it.

## Constraints and non-goals

- **One engineer.** Every service in production is one more thing for me to provision, patch,
  monitor and pay for. That is the main constraint, not throughput.
- **One API instance**, on a small cloud machine with a small managed Postgres. A few thousand
  jobs a day.
- **Non-goal: horizontal scale.** Until one instance can't keep up, a second one costs more in
  coordination than it saves.
- **Goal: an import that was accepted must finish.** It can be slow, and it can retry, but it
  must never be lost without anyone noticing.

## Version 1: Redis, doing one job

The first version followed standard advice: a Redis-backed job queue. When I audited what
Redis was actually doing, the answer was queuing jobs and nothing else. No caching, no pub/sub,
no state shared between processes. It was a whole stateful service, with its own memory limit,
backups, credentials and monitoring, providing something Go already has built in.

## Version 2: buffered Go channels

I removed Redis. Each job type got a buffered channel inside the API process and its own
worker pool, sized to what that stage waits on: a few workers for I/O-bound parsing, a capped
pool for database writes so a large import couldn't take every connection and starve live
requests, more for CPU-bound analytics. Sessions moved to Postgres, behind an index for their
real access pattern: written once, read on every authenticated request.

This was a good trade at the time, and I wrote down what would reverse it: running a second
API instance, or needing jobs to survive a restart. I even named the destination, a managed
cloud queue, and put the queue behind an interface so the move would be a swap.

The second condition arrived before the first. When I wrote the failure table for the system,
the in-memory queue produced more rows than anything else:

| Failure | What happened | Worst case |
|---|---|---|
| Deploy or crash during an import | The job was a Go value in memory, gone with the process | The trader's upload silently never imported |
| Queue full | The channel held 100 jobs per type; the next was rejected | Numbers stale, no signal |
| Shutdown | The process could close the database while a job was still writing | A recompute half done |
| Upload file | Waited in a temp folder inside the container | Lost on every redeploy |
| Analytics job already running for an account | The second one was skipped, **and reported as a success** | A second import never reached the analytics |

The last row is the one that worried me. It wasn't a crash. Everything reported success and
the numbers were simply wrong. Every row ends in a trader seeing figures that no longer match
their trades, which is the one thing a journal can't get wrong.

## Version 3: a table

The plan said "move to a cloud queue". When I wrote the options down properly, a Postgres
table beat it:

| Option | Good | Cost |
|---|---|---|
| Managed cloud queue | Durable, scales past one instance | Another service and its credentials; a job can't be created in the same transaction as the write that caused it |
| Bring back Redis | Fast, familiar | Everything that got it removed |
| **A `jobs` table in the existing Postgres** | Already running, already backed up; a job is enqueued **in the same transaction** as its write | Polling; not built for very high throughput |

The deciding argument was the transaction. If an import writes fills and queues the work that
depends on them in one transaction, then the job exists if and only if the write does. No queue
outside the database can give that without extra machinery.

Workers claim jobs with `FOR UPDATE SKIP LOCKED`, so two workers never take the same row. The
rest of the design is four indexes doing what I used to do in Go:

- **Serial keys.** A unique index allows one *running* job per key, such as `account:<id>`.
  Postgres itself refuses a second running import into the same account. It survives restarts
  and needs no lock cleanup.
- **Coalescing.** A unique index allows one *queued* job per key. Ten changes during a run
  leave exactly one queued job, which runs after the current one. The change is never skipped,
  which fixes the "skipped and reported as success" bug by construction.
- **Leases.** A running job holds a lease that its worker extends every third of its length.
  If the process dies, the lease lapses and another worker picks the job up.
- **Priority.** Imports first, then scheduled work, then backfills, so a large backfill can't
  hold up a trader waiting for an upload.

Uploads moved to object storage under a generated key, never the trader's file name, and the
job deletes the file once its fills are stored.

## How it breaks

| Failure | Detection | Automatic response | Worst case | Test |
|---|---|---|---|---|
| Process killed mid-job | Lease lapses | Another worker reclaims and reruns it; handlers are idempotent | The import finishes a few minutes late | Kill a worker mid-job: it completes once after restart |
| Deploy during a job | Shutdown signal | Stop claiming, give running jobs 15 s, then put their rows back to queued before the database closes | The job reruns after the deploy | Shut down with a job running: row is back to queued |
| Two imports into one account | Unique index on the running serial key | The second waits | Slower, never interleaved | Two imports, one account: the second starts after the first |
| A file that will never parse | Handler marks the error permanent | Fails at once, not after three retries | The trader sees the error immediately | Unparseable tradebook ends `failed` on the first attempt |
| Transient error | Handler returns an error | Exponential backoff, 3 attempts | `failed` with the last error kept on the row | Error twice then succeed: `done` after three attempts |
| Progress event lost | The live progress stream is best effort | The row still holds the outcome; status reads the row | Progress bar stalls until refresh | *Open: the stream can drop its final "done" event under load* |

The last row is a known gap, written down in the design rather than left out. The browser
watches progress over server-sent events, and a full broadcast buffer can drop the event that
says the job finished. The job's result is safe in the table. The screen can be wrong until
the user refreshes.

## What it cost

- **One migration, one table and a worker loop**, plus rewriting each job type as an
  idempotent handler. Idempotence was the real work: every handler must leave the same state
  if it runs twice, because leases guarantee that sometimes it will.
- **Polling.** Workers wake at once through an in-process channel when this process enqueues,
  and poll every 2 seconds for retries and scheduled jobs. With one instance, Postgres
  notifications would add a dedicated connection for no gain.
- **A ceiling.** This holds a few thousand jobs a day comfortably. It isn't the design for a
  million. When there is a second instance, the wake channel, the rate limiter and the progress
  stream all have to change, and that assumption is recorded with its status (held).
- **Removed:** per-type worker pools and the connections each one held idle, the scheduler's
  in-process timer (a restart at 15:31 used to skip that day's end-of-day job), and the temp
  upload folder.

## What I got wrong

*2026-11-04.* My reversal condition for version 2 was right, and my named destination was
wrong. I wrote "needing jobs to survive a restart" as a *future* trigger. In fact it was already
true on the day I wrote it. An accepted upload has to survive a deploy, and every deploy
restarts the process. I
only saw that once I wrote one row per failure and had to fill in the worst case.

The broader lesson: "what reverses this" is half of a good decision record. The other half is
checking it against the failure table, now, instead of waiting for the trigger to show up in
production.
