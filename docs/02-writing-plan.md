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
| 1 | Every failure has a price: designing a trading engine around its worst case | artha-engine `failure-modes.md`, `00-principles.md`, `first-live-session.md` | failure, data-integrity, performance | Published 2026-11-04 |
| 2 | Delete the running totals | Tracktions ADR-0010, spike S3 | data-integrity, performance, failure | Published 2026-11-04 |
| 3 | The job queue I built three times | Tracktions flow 06, failure modes F15/F29, `tracktions-architecture` | failure, cost | Published 2026-11-04 |
| 4 | A number the user can't misread | Tracktions principles P2–P5, ADR-0005, failure modes, `sample-confidence.md` | ux, data-integrity | Published 2026-11-04 |
| 5 | One engine, one order manager per account | artha-engine ADR-0019, failure modes | failure, data-integrity, security | Published 2026-11-04 |
| 6 | What Tracktions costs to run, line by line | Tracktions | cost | Planned |
| 7 | A security post (sessions, error messages that leaked SQL, credentials per process) | Tracktions `conventions.md`, artha-engine | security | Planned |

The old post 2 (what the first live sessions broke) is covered by post 1's last section; dropped.

One post a month from here. Each post is reviewed by Shivam before `draft: true` is removed.

## Rules for private work (P2)

Write the decision, not the system. Name components by role. No strategy logic, entry rules,
signals or thresholds, no P&L, no account identities, no credentials. Broker and vendor names are
allowed only where Shivam confirms (see Questions for the review).

## Bio sources

The homepage bio, project cards and `/about/` take every fact from the resume variants in
`~/Documents/job-switch/` (A–D and the PDF, read 2026-11-04). Only numbers marked verified or
stated in its `metrics-ledger.md` are used. Left out on purpose:

- **9,000 transactions → 2,400 trades in under 10 s**: one recalled run; the ledger says re-run it
  first.
- **Go file and migration counts**: they change every increment, so they go stale on a static site.
- **Start month at BNY**: the PDF says Mar 2022, the Markdown variants Jul 2022. The site says 2022.
- **Phone number and city**: email only; "India".

## Open items

- `/about/` links `tracktions-architecture`, which still says Redis-to-channels with SQS as the
  destination; posts 2–3 supersede it. Update that README or add a pointer to the posts.
