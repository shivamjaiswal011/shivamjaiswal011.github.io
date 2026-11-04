---
title: A number the user can't misread
description: The UX rules behind Tracktions' analytics. No metric without its sample size, no backtest leaking into live numbers, no stop the trader didn't place, and nothing that reads like advice.
published: 2026-11-04
project: tracktions
concerns: [ux, data-integrity]
---

Most UX work on a dashboard is about layout: what goes where, what's above the fold. In a
trading journal the more dangerous problem is a number that is **correct and still misleading**.
A trader who believes the wrong number puts real money behind it.

So the analytics in Tracktions follow a few rules about what a number is allowed to look like.
Each one came from a specific way a correct calculation could still mislead.

## The problem

Three examples from the old product, all computed correctly:

- **An SQN from 15 trades.** SQN is Van Tharp's System Quality Number, a score for how good a
  strategy's results are. From 15 trades it's mostly noise. The trader most likely to believe
  it is a beginner with 15 trades.
- **A drawdown that included a backtest.** One backtest trade in a live account's numbers makes
  the live drawdown look smaller than it really is. That is the number traders trust most.
- **A loss shown as −6.5R.** R is the planned risk on a trade: the loss if the first stop is
  hit. R was measured from the *current* stop, which the trader had trailed close to the price.
  A planned −1R loss showed as −6.5R.

None of these was an arithmetic bug. Each was a design that let a true number say something
false.

## Constraints and non-goals

- **Traders abandon journals because of typing.** So any fix that asks for more input fails
  for the people who most need it.
- **Indian market rules.** Recommending a position size or a strategy to a person comes close to
  SEBI's rules for investment advisers and research analysts.
- **Non-goal: telling a trader what to do.** The right risk depends on how much loss the trader
  can stand. Only they know that.

## Rule 1: no metric without its sample size

Every metric is shown with the number of trades behind it. Below that metric's minimum, the
screen says **"not enough trades yet (8 of 30)"**, never a bare number.

The alternative was to hide low-sample metrics entirely. It lost because hiding teaches
nothing. "8 of 30" tells the trader that eight trades prove nothing, and gives them a goal.
Above the minimum, numbers carry a label too: *early* below 30 trades, *reliable* from 30,
*settled* from 100. Expectancy is shown with a 90% interval. Win rate uses a Wilson interval,
because the simpler formula breaks at 0% and 100%, which is exactly where small samples land.

## Rule 2: backtest and paper never mix with live

Each account has a kind: live, paper or backtest. Live-only numbers (equity, heat, drawdown,
guardrails) come only from live accounts.

The obvious design was a per-trade source flag that every query filters on. It lost because one
forgotten filter mixes them, silently. Making the kind a property of the account and building
live-only queries around it turns "remember to filter" into the default. A repository test then
seeds one backtest trade into every live-only query and checks that it's ignored.

## Rule 3: show where every value came from

Tracktions works out what it can instead of asking: a stop from the trader's own risk rule, a
strategy from the trade's pattern. Every inferred value is stored with its **source and
confidence**, the UI shows it ("inferred"), and one tap overrides it. The trader's own value
always wins, including over a later rebuild.

The source matters most for stops. A stop placed by a rule is labelled as one. Otherwise a
trader could believe they had a stop they never set, and their R would describe a plan that
didn't exist. Strategy assignment is written only above 0.9 confidence. Below that, the trade
stays unassigned rather than guessed, because a wrong guess moves one strategy's numbers using
another strategy's trade.

R is always measured from the **initial** stop, stored separately from the current one, so
trailing a stop can never turn a −1R plan into −6.5R.

## Rule 4: a calculator, not an adviser

The trader chooses their style, risk rules, promotion gates and size. Tracktions computes what
follows from those choices and from their own trades. It never names a recommended risk level
or a strategy.

This decided small details of the interface:

- **The sizing simulator** shows six risk levels, each computed from the goal and the maximum
  loss the trader entered, and each named by what it maximises. All six are shown and none is
  pre-selected. A best fit for the trader's own stated goal is a calculation. A size chosen for
  them is advice.
- **No "optimal", "recommended" or "best" on any screen.** Each level is named by what it does
  for the trader's goal, such as "the risk level with the highest chance of your goal". A sizing
  model whose textbook name contains "optimal" is shown by how it sizes instead.
- **Insight text says "your numbers show", never "you should".**
- **Promotion gates** (for example 100+ trades and an SQN of at least 2.5 before scaling up)
  are defaults the trader can edit, labelled as starting points. Moving to the next stage needs
  the trader's confirmation.

Recommending would make a stronger pitch ("scale to 1%"). It would also put the product closer
to regulated advice, and take the decision away from the person who carries the loss.

## How it breaks

| Failure | Detection | Response | Worst case | Test |
|---|---|---|---|---|
| Metric shown on too few trades | Every metric carries N and a label | Below minimum: "not enough trades" | Trader scales up on noise | 8 trades: no SQN value, label set |
| Backtest trade counted in live numbers | Live-only queries filter on account kind | — | Live drawdown looks smaller than it is | One backtest trade seeded per live-only query |
| R measured from a trailed stop | Initial stop stored apart from the current stop | — | A loss shows as −6.5R | Trade with a trailed stop: R from the initial one |
| Rule-placed stop mistaken for the trader's own | Stop source shown in the UI | — | Trader believes they had a stop | UI label test |
| Trade assigned to the wrong strategy | Low-confidence assignments are never written | Left unassigned | One strategy's SQN moves on another's trade | Two candidate versions: unassigned |
| Rebuild overwrites the trader's correction | Values with source `trader` are skipped | — | Trust lost | Rebuild with a trader-set value: unchanged |
| Simulator read as advice | Response has no recommendation field; nothing pre-selected; disclaimer under every table | — | Regulatory exposure; trader blames the tool | Snapshot test: no recommendation field |
| Net results wrong | Facts carry gross, charges and net; every metric reads net | Broker charges preferred over the rate card | A strategy that only wins before costs looks good | Round trip with charges: R from net |

## What it cost

- **Every metric needs a stated minimum and an interval,** which is a spec per metric, not a
  global setting.
- **A provenance record per inferred value,** and UI that shows "inferred" without nagging.
- **A weaker pitch.** "Your numbers show" sells less than "do this". I think it's the honest
  version, and it keeps the product a calculator.
- **Smaller samples.** Showing edge metrics per strategy version instead of per account splits
  the trades, so more numbers sit below their minimum for longer. Rule 1 makes that visible
  instead of hiding it.

## What I'd tell myself at the start

These look like copy problems that a reworded insight or a tooltip could fix. They are
data-model problems. The −6.5R loss was real, and it was fixed with a migration that stored the
initial stop as its own column, not with a label. "Never measure R from a trailed stop" is a separate column. "Never mix
backtest into live" is a property of the account. "Show where a value came from" is a provenance
record on every inferred field. A label can only be honest if the data underneath records the
difference it describes.
