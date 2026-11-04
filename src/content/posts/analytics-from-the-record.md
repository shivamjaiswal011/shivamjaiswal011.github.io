---
title: Delete the running totals
description: Tracktions stored about 60 running columns per trade per scope, and every past edit had to rewrite history. I replaced them with metrics computed on read from trade facts, and benchmarked 100,000 trades before writing the code.
published: 2026-11-04
project: tracktions
concerns: [data-integrity, performance, failure]
---

A trading journal has one job its users can check: the numbers must match their trades. If a
trader fixes a stop, re-uploads last month's tradebook or moves a trade to another strategy,
every number that depends on it must change, and nothing else may.

Tracktions met that badly. This post is about the design that replaced it, and about measuring
the replacement before building it.

## The problem

Analytics were stored as **running totals**: one row per trade, per scope, with about 60
cumulative columns (P&L so far, running SQN, sums of squares, peak balance). Reading a
dashboard was one row. Everything else was hard:

- **A change to any past trade invalidated every later row.** A backdated import, an edit or a
  charges fix meant deleting the rows after it and recomputing them, in separate statements that
  weren't one transaction.
- **A second change during a recompute was skipped.** If analytics were already running for an
  account, the new job was dropped and reported as a success.
- **New scopes multiplied the rows.** The product was adding strategy versions, account kinds
  (live, paper, backtest) and a view across all of a trader's live accounts. Each scope meant
  another full set of running rows to keep consistent.
- **The git history showed it.** Five separate fixes for double counting, reordering and
  recalculation in one area.

None of these was a bug in one line. The design made every change dangerous.

## Constraints and non-goals

- **Size.** A heavy intraday trader takes 4,000–5,000 trades a year. Ten years is about 50,000.
  The design has to hold at 100,000 per trader.
- **Hardware.** One small API instance and a small managed Postgres.
- **Non-goal: sub-millisecond dashboards.** A trader opens a page a few times a day. 300 ms is
  fine; a wrong number isn't.

## Options

| Option | Good | Cost |
|---|---|---|
| A. Keep running totals and add scopes | Reads are one row; the code exists | Rows multiply by scope; every past change rewrites history per scope; each new metric needs new columns and a backfill |
| **B. Store trade facts; compute metrics on read; cache by a version number** | Correct by construction: a scope is a filter, and there is nothing to reorder or patch | A full pass over the trader's trades on every uncached read; metric code rewritten as pure functions |
| C. Database materialized views per scope | Declarative | SQN, streaks and drawdown don't fit SQL well, and a refresh recomputes everyone's view |

## Decision: three layers, each derived from the one before

The idea comes from *Designing Data-Intensive Applications*: separate the **system of record**
(what was observed, written once) from **derived data** (anything computable from it). Derived
data should be a deterministic function of the record, so it can be thrown away and rebuilt.

1. **The record.** Fills as the broker reported them, each with a content hash so a re-upload
   can't double them. The trader's own inputs, with where each came from. Reference data with
   effective dates: instruments, lot sizes, charge rate cards.
2. **Trade facts.** A deterministic builder turns fills into trades per account, instrument and
   product: exit legs, gross, charges, net, R. Same input, same rows. A rebuilt trade keeps its
   identity through its fills, so the trader's notes and stops stay attached.
3. **Metrics,** computed when asked. They are pure functions over a slice of trade facts. A
   strategy version, an account or "all live accounts" is just a different filter.

A cache keeps it fast. Each user has a `data_version` that goes up **in the same transaction**
as any write to their record or trades, and the cache key includes it. So a cached number
can't outlive its input: the edit and the invalidation commit together or not at all.

## Measure before building

Option B is only right if a full pass over 100,000 trades is cheap enough. So the first step
was a benchmark, not code, with the budget written down before any numbers came in: the trader
view within **300 ms at p95 uncached**, **20 ms cached**.

A uniform synthetic data set would have flattered the result, so the generator copied a real
scalper's shape. It had bursty days of 200 trades, one symbol with 30,000 trades, partial
exits, options held to expiry, a fifth of trades without a stop and a quarter not assigned to
any strategy. It also had 1,000 other users in the same tables, so reads had to use indexes
rather than scan a toy table.

It also measured **every way the data changes**, end to end from the change to the first fresh
read, not only a clean read. Under this design every change ends in an uncached read.

| Scenario | Budget (p95) | Measured |
|---|---|---|
| Trader view, uncached, 104,000 live trades | 300 ms | 67.5 ms |
| Trader view, cached | 20 ms | 0.1 ms |
| Stop edited, then a fresh view | 400 ms | 68 ms |
| Backdated fill in the busiest symbol (27,820 fills rebuilt), then a fresh view | 2 s | 251 ms |
| Import undone (721 fills), then a fresh view | 2 s | 299 ms |
| Full rebuild of the heavy trader | 60 s | 2.6 s |
| Views read *during* that rebuild | 300 ms | 95 ms |
| Every user rebuilt, 1,001 users, 629,000 trades | 10 min | 6.5 s |

Two things stood out:

- **Reading rows is the cost, not the arithmetic.** The same view with the facts already in
  memory took 6 ms, so about 60 of the 67 ms is moving 104,000 rows out of Postgres. That tells
  me which fix comes first if production is slower.
- **Reads during a full rebuild stay within budget,** because Postgres keeps serving the old
  trades until the rebuild commits. A trader never sees a half-rebuilt history.

## How it breaks

| Failure | Detection | Response | Worst case | Test |
|---|---|---|---|---|
| A cached number outlives its input | Cache key includes `data_version`, bumped in the write's transaction | — | — (can't happen without a bug in the bump) | Edit a trade: the next read misses the cache |
| Change arrives while a job computes | Job records the version it read | Result stored as behind, shown as "updating"; job reruns | A few seconds of "updating" | Two imports during one job: final result reads the later version |
| Rebuild discards the trader's input | Rebuilt trades inherit IDs from their fills, updated in place | — | Hours of tagging lost | Backdated import: every input still attached |
| Gross P&L shown as the result | Facts carry gross, charges and net separately; metrics read net | — | A strategy that only wins before costs looks profitable | One round trip with charges: R computed from net |
| Production is slower than the laptop | Uncached p95 watched in production | Cheapest fix first: cache, faster row transfer, then facts kept in memory | Slow pages, still correct | Rerun the benchmark on a temporary copy of production-size hardware |

## What it cost

- **About 9,500 lines of analytics code are replaced,** along with the running-total tables,
  checkpoint tables and per-account locks. The formulas carry over as pure functions, and their
  existing tests become the test cases.
- **A persistent job table** for the expensive parts, since a recompute must survive a restart
  ([the job queue post](/posts/three-job-queues/)).
- **An honest gap in the evidence.** The benchmark ran on my laptop with Postgres uncapped. The
  production database is a burstable instance whose CPU drops sharply when its credits run out,
  so the 60 ms row transfer could be several times slower there. The budget had 4.5× headroom.
  I decided not to buy production-size hardware for a bottleneck no user has hit, and wrote
  down the signal that reopens it: the uncached p95 passing 300 ms in production.

## What I got wrong

*2026-11-04.* The running totals were an optimisation for a read speed this data size never
needed, and I paid for them in correctness for most of the product's life. *Designing Data-Intensive
Applications* states the rule plainly: maintaining state incrementally is an optimisation, and
you adopt it only when recomputing is too slow. I had it the wrong way round. I built
incremental maintenance first and never measured whether recomputing was slow.
