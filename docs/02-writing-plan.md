# Writing plan

**Positioning.** A full-stack engineer who designs for the breaks: what happens when a process
dies, a call times out, a token leaks, a page is slow or a number is wrong. Every post proves that
with a real decision from a real system (P4).

## Concerns

Each post's `concerns` field lists the ones it covers (checked by `src/content.config.ts`).

| Key | Label | The question a post answers |
|---|---|---|
| `failure` | failure modes | What happens if this dies between any two lines? |
| `security` | security | Who can call this, and what leaks if a secret does? |
| `performance` | performance | What is the budget, and what did I measure? |
| `ux` | UX | What does the user see when it is slow, wrong or down? |
| `data-integrity` | data integrity | Can every derived number be rebuilt from its source? |
| `cost` | cost | What does it cost, and what makes it cost 10×? |

## Post shape

The template is `src/content/posts/example-decision-write-up.md` (draft, never published). Based
on the Google mini design doc (Ubl): problem, constraints and non-goals, options, decision, how it
breaks (a failure table: failure, detection, response, worst case, test), the other concerns that
apply, cost, and a dated "what I got wrong" section. 1,200–2,500 words.

## Series, in order

| # | Post | Source docs | Concerns | Status |
|---|---|---|---|---|
| 1 | Every failure has a price: designing a trading engine around its worst case | artha-engine `failure-modes.md`, `00-principles.md`, `first-live-session.md` | failure, data-integrity, performance | Draft |
| 2 | What the first two live sessions broke (assumptions vs measurements) | artha-engine `first-live-session.md`, `assumptions.md` | failure, performance | Planned |
| 3 | Keying every order, fill and position by account from day one | artha-engine ADR-0019 | data-integrity, failure | Planned |
| 4 | A Tracktions decision: security or UX under failure | Tracktions docs (to choose) | security, ux | Planned |
| 5 | What Tracktions costs to run, line by line | Tracktions | cost | Planned |

One post a month. Each post is reviewed by Shivam before `draft: true` is removed.

## Rules for private work (P2)

Write the decision, not the system. Name components by role. No strategy logic, entry rules,
signals or thresholds, no P&L, no account identities, no credentials. Broker and vendor names are
allowed only where Shivam confirms (see Questions for the review).

## Open items

- Which Tracktions decision anchors post 4: needs Shivam's pick.
