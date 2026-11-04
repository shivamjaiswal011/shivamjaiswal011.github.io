---
title: One engine, one order manager per account
description: How artha-engine trades several family accounts from one strategy without one account's expired login, hung broker call or kill switch touching another, and why every order, fill and position carries an account from the first draft.
published: 2026-11-04
project: artha-engine
concerns: [failure, data-integrity, security]
---

artha-engine is my event-driven options trading engine. It runs one set of strategies, and those
strategies need to trade more than one person's account, possibly at different brokers. It's
easy to put that requirement on a list. It also changes the data model, the process layout, the
security boundary and the failure table, and it's much cheaper to design in from the start than
to add later.

## The problem

One strategy makes one decision: enter here, exit there. Several accounts have to act on that
decision, and each one can fail on its own:

- one holder's daily login has expired;
- one broker's API hangs or rejects the order;
- one account hits its own loss limit;
- one account is killed by hand.

The question is what each of those does to the *other* accounts.

## Constraints and non-goals

- **Regulation sets the boundary.** SEBI's February 2025 circular on retail algorithmic trading
  lets a retail investor run their own algo for their **family**: self, spouse, dependent
  children and dependent parents. Placing algo orders for anyone else makes you an algo
  provider, which needs empanelment with the exchanges.
- **Each account has its own credentials.** The same circular requires a client-specific API
  key, a static IP whitelisted by the broker, and two-factor login. So every account logs in
  separately, every trading morning.
- **Same rule as the rest of the engine:** no failure may cost more than a limit set before the
  order was sent ([Every failure has a price](/posts/every-failure-has-a-price/)). It now holds
  *per account*.
- **Non-goal: managing outside money.** That's a business decision with legal work behind it,
  not a configuration change.

## Options

| Option | Good | Cost |
|---|---|---|
| One order manager for all accounts | One process | One account's stuck call or halt blocks everyone; one process holds every person's credentials |
| One whole system per account | Total isolation | Duplicate feeds, bars and engines, and the data vendor's connection limit is hit quickly |
| **One engine; one order manager per account** | A hung API, expired login or halt in one account never touches another; each account's state has exactly one owner | One more supervised process and broker connection per account |

## Decision

- **The engine doesn't know accounts exist.** It emits one *intent* per decision, as before.
  Strategy rules and replay are unchanged, so the engine is still a pure function of its event
  log, and the replay tests that prove it are unaffected.
- **One order manager per account.** Each one reads every intent, and owns its own account's
  orders, positions, risk counters, broker-side stops and reconciliation. Execution broker, lot
  sizes, loss limits, credentials, kill switch, charges and reports are all per account.
- **Each account stands alone.** If an entry fills in one account and is rejected in another,
  nothing is unwound and nothing is retried. Each account's exits follow its own fills.
- **The engine follows the first fill.** A strategy position is named by its entry intent. The
  engine treats the position as open when the first fill for that intent arrives from any
  account. Its exit intents name that entry. Each order manager exits whatever its own account
  holds from it, and an account with no fill ignores the exit.
- **Family only, checked at startup.** The account config records each holder's relation, and
  the config checker refuses to start with any relation outside SEBI's definition.

## The data model, from the first draft

This is the part I'd tell anyone to copy. Every order, fill and position is keyed by account
**in the first version of the schema**, even when only one account exists:

- `orders` and `positions` carry `account_id`. An intent becomes at most one order per account.
- Order events are named per account (`order.<account>.<event>`), so one account's stream can be
  replayed or audited alone.
- The order-rate limiter runs per account, because SEBI's order-per-second threshold is per
  client.
- Tests use **two accounts that disagree**: one fills and one doesn't, one exits first, one
  fills late. A randomised test interleaves their events and checks that each account's position
  only ever follows its own fills.

Adding `account_id` later means a migration over every order table, plus a hunt through every
query that silently assumed one account. With a single account in testing, that bug stays hidden
until real money is split across two accounts.

## How it breaks

| Failure | Detection | Automatic response | Worst case | Test |
|---|---|---|---|---|
| One holder's login not done by market open | No valid token at 09:15 | That account sits out the day; the others trade | Nothing lost: no position was opened | Two accounts, one without a token |
| Entry fills in one account, rejected in another | Order events per account | Nothing unwound or retried; each account exits its own fills | At most that trade's premium, in each account that filled | Fake brokers: one fills, one rejects |
| One account's broker API hangs | Timeout in that order manager | That order goes to *unknown* and is reconciled with its broker; the other order managers are separate processes and don't wait on it | Within that account's limit | Hang one fake broker during a replayed session |
| One account hits its loss limit | Its own risk counters | Exits only, for that account | Within that account's limit | Push one account past its limit in replay |
| The exchange stops the algo | Orders rejected from every account | Every account goes to exits only; broker-side stops protect | Every account at once, each within its own limit | *A shared risk, not a design gap: the exchange can stop one algo ID across all its accounts* |
| A process holding credentials is compromised | — | Each order manager holds only its own account's credentials | One account's credentials, not every family member's | Config check: one credential set per process |

The second-to-last row is a risk this design accepts. The circular lets the exchange kill-switch
every order from one algo ID, and every family account trades under the same algo. The design
can't prevent that. It can only keep each account inside its own limit while it happens.

## What it cost

- **One more supervised process and broker connection per account,** each with its own daily
  login.
- **Partial fills across accounts are normal,** not an error. The same signal can leave one
  account in a trade and another out of it. That is honest, and it makes the per-account reports
  differ from the strategy's ideal.
- **A new account starts at the smallest size,** whatever stage the strategy has reached. A
  proven strategy still has to prove itself in each new account's plumbing.

## What I got wrong

*2026-11-04.* Keying by account in the schema wasn't enough. While building one strategy's
order tracking, a review flagged the same kind of bug twice. First, a late fill in one account
reopened a position that had already closed. Second, the first account's exit freed a shared
index for *all* accounts. Both bugs were in quantity code that had quietly been written for one
account. Neither would have shown up with one test account.

Since then the rule is stricter. Any code that tracks a quantity is designed per account before
it's written, and per-account behaviour is the first thing a review checks. A "one account for
now" shortcut is never allowed on a quantity path.
