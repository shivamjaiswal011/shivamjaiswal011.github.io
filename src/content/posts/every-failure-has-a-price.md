---
title: Every failure has a price
description: How I designed a trading engine around one rule, that no failure may cost more than a limit set before the order is sent, and what the first live sessions proved wrong.
published: 2026-11-04
project: artha-engine
concerns: [failure, data-integrity, performance]
---

Most system designs describe what happens when everything works. The feed delivers ticks, the
engine decides, the broker fills, the dashboard updates. That part is easy to draw and easy to
test.

The part that costs money is everything else. A trading engine that holds a position when its
process dies, its home internet drops or its broker call times out is not a bug report. It is an
open loss with nobody watching it. So before writing any code for artha-engine, my event-driven
options trading engine, I wrote down one rule and made every other decision answer to it.

## The rule

**No failure may cost more than a limit set before the order was sent.**

Two numbers are known before any entry goes out: the trade's planned loss if it exits at its
stop, and the worst case of everything open together, assuming every stop fails at once. If an
entry would push either past its limit, the entry is not sent. If a design can't meet the rule,
the design changes, not the limit.

That sentence sounds obvious. Its value is that it turns "is this robust?" from an opinion into a
check. Every failure gets a row in a table, and every row has to end in a number.

## Constraints and non-goals

- **One machine, one home connection.** The engine runs on a laptop at home, not in a data
  centre. Power cuts, Wi-Fi drops and OS updates are normal events, not disasters.
- **Real money from day one of live trading**, across more than one account, each with its own
  orders and fills.
- **Non-goal: high availability.** A second machine or a second internet link would remove some
  failures, but it doubles what has to be kept in sync. I chose to bound the cost of a failure
  rather than prevent it. A single link is a recorded, deliberate gap.
- **Non-goal: speed.** This is not high-frequency trading. Decisions are made on closed one-minute
  bars, so microseconds don't matter and correctness does.

## The failure table

The design has a file called `failure-modes.md`. Each row is one failure I can name, and every
row must fill in five columns:

| Failure | Detection | Automatic response | Worst case | Test |
|---|---|---|---|---|
| Order call times out | No response in N seconds | Order marked *unknown*; new entries stop; reconcile with the broker; never resend | One unintended position, at most that trade's premium | Fake broker that times out but fills |
| Primary market feed drops | No tick for 10 s | Bars continue from the standby feed; degraded alert | Nothing extra; trading continues | Kill the feed during a replayed session |
| Both feeds down | No ticks for 10 s | Exits only; exits run on the last price; broker-side stops rest | Open positions only, within the cap | Kill both feeds in replay |
| Engine crashes | Heartbeat; process supervisor | Restart and catch up from the log | Exits paused while it catches up; within the cap | Kill it mid-session with positions open |
| Home network drops | Feed and broker calls fail | Exits only; an outside heartbeat service alerts my phone | Within the cap; broker-side stops still protect | Pull the cable during a paper session |
| A safety check errors | Exception or block-rate alert | Entry blocked; exits never blocked | A missed entry | Make a check throw |

There are about forty rows across market data, orders, the machine and the strategy. A row
that can't meet the rule is treated as a design bug, the same way a failing test is. Rows I
can't close yet are listed as known gaps, with what closes them, instead of being left out.

Writing the table changed the design more than any diagram did. Four of the decisions it forced
are below.

## Decision 1: unknown means stop, not guess

The system this engine replaces treated a timeout on "place order" as a failed order. But a
timeout tells you nothing about the outcome. The broker may have filled it, and then you hold a
real position the system doesn't know about.

The obvious fix is to retry. Retrying is only safe if the broker rejects a duplicate request, and
the broker I execute through treats the client tag as a label, not a deduplication key. A retry
can double the position.

So a timeout moves the order to a state called `unknown`, every new entry in the system stops,
and reconciliation asks the broker what really happened. **Cost:** one unclear response can pause
trading for seconds to a minute. A missed entry costs nothing. A doubled position does.

## Decision 2: entries fail closed, exits fail open

Every entry passes through checks: is the data fresh, is the quote two-sided, is the spread sane.
The old system let a trade through when a check threw an error. I flipped that, but only for
entries:

- if anything needed to **enter** is broken, the entry is blocked;
- nothing blocks an **exit**. An exit ignores stale data, missing indicators and check errors.

**Why the asymmetry:** you can't tell a broken check from a quiet market, and the two mistakes
don't cost the same. **Cost:** a bug in a check shows up as "no trades today", which is silent.
So every block is logged with its reason and counted, and a check that blocks everything raises
an alert.

## Decision 3: the broker holds a stop, because my laptop can't promise to

If every exit depends on the engine running, then a crash, a laptop going to sleep or a network
drop leaves a position with no exit at all. So after every fill, before doing anything else, the
order manager places a protective stop **at the broker**. If the broker rejects that stop, the
position is closed immediately.

The trade-off is in where the stop sits. Too close and normal price swings trigger it. Too far
and it does little. The broker-side stop sits well beyond the strategy's own stop, far enough to
leave normal swings alone. Its job is not to keep the loss within the limit, because the sizing
rule already does that. Its job is to cut the *expected* loss when my side fails, from "ride it
until the exchange's end-of-day square-off" to something much smaller.

## Decision 4: any process can die between any two lines

Every process must survive being killed at any point and restart without doubling or dropping
anything. That forces two things:

1. **One writer per piece of state.** Positions and orders have one owner, bars have one owner,
   limits have one owner. The old system once had two components writing the same trade row and
   racing each other.
2. **A raw event log as the source of truth.** Every market event and every order event is
   appended to a log before anything acts on it. Bars, option-chain snapshots and positions are
   derived, and can be rebuilt by replaying the log. Orders are committed to the database before
   they're sent, so a disk fault on the log can lose market data but never an order.

The same strategy code runs in historical replay, paper trading and live trading. It can't tell
which mode it's in, because the clock, the data and the broker are all interfaces. That is what
makes a crash test cheap: replay a recorded day, kill the engine at a chosen point, and check the
result matches an uninterrupted run.

## What the first live sessions proved wrong

Every number the design depended on was either measured or listed as an assumption, with the test
that would settle it. The first two live sessions (27 and 28 October 2026) settled several, and
not in my favour:

- **"A crashed engine restarts in seconds."** Wrong. Killed with positions open, the engine took
  nearly three minutes to catch up, re-reading about a million events. Nothing was lost or sent
  twice, and the day's decisions matched an uninterrupted replay one for one. But the catch-up time
  grows through the day: by mid-afternoon it would be about twenty minutes. During that time, only
  the broker-side stop protects an open position. The rule still holds, because that stop is
  there. The assumption did not, and I now checkpoint the engine after every bar so a restart
  starts near where it stopped.
- **"End-of-day bars take under a minute."** Wrong: about eight minutes. Building them takes one
  to three minutes. The rest is reading the whole day back from the log, which I never measured.
  I had measured the cheap part and estimated the expensive part.
- **"The feed writer keeps up."** It didn't. Writing one acknowledged event at a time couldn't
  keep up with around 600 events a second after a reconnect, so events spilled to a local file,
  and the spill took three hours to drain. Batched writes fixed it. The next day the spill file
  stayed empty.
- **An outage I didn't model.** On day two, the development machine ran short of memory and the
  tool that had started every process stopped all of them at once. Nothing was recorded for 31
  minutes. The log recovered in 13 seconds with everything up to the outage intact. The fix was
  operational, not code: each process now runs on its own.

None of these cost money, because the sessions ran on paper and the rule held in each case. But
each one was a confident number in a design document, and each was wrong by a factor of three to
twenty. That's why the design marks every number as either *measured* or *assumed*, and treats an
assumed number as a test that hasn't run yet.

## What it cost

- **More code on the unhappy paths than the happy one.** Reconciliation, the `unknown` state,
  catch-up replay and broker-side stops are each more work than the feature they protect.
- **Silent failure modes need loud alerts.** Fail-closed checks and a paused-on-unknown order
  flow are safe but quiet, so they each need counters and alerts to be noticed.
- **Restart tests for everything.** "Any process can die between any two lines" is only true if a
  test kills it between those lines. Every handler has to be idempotent.

## What I'd tell myself at the start

Write the failure table before the architecture diagram. The diagram shows how the parts
connect. The table shows what each connection costs when it breaks, and that is what decides the
architecture. And put a measurement or the word *assumed* next to every number, because the
numbers you are most sure of are the ones nobody has checked.
