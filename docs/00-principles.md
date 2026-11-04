# Principles

## P1. Writing is the proof
**Rule.** Each project shows its problem, constraints, rejected options and costs in prose and
diagrams, so a reader needs no code access.
**Why.** Tracktions and artha-engine are private repos; reviewers cannot read the code.
**Alternative.** A GitHub profile README linking repos. Lost: the links open to 404 for anyone
without access.
**Cost.** Each project needs at least one written post before it is convincing.

## P2. Publish the engineering, not the money
**Rule.** No credentials, account identities, broker API keys, trading strategy or revenue numbers
in any post, screenshot or diagram.
**Why.** artha-engine trades family accounts (ADR-0019 there); its strategies are private.
**Alternative.** Publish everything once the engine is open-sourced. Lost: strategy stays private
even then.
**Cost.** Screenshots need redacting; some numbers are given as ratios instead of values.

## P3. Content is Markdown in this repo
**Rule.** Posts are Markdown files under `src/content/posts/`, checked into git, built to static
HTML.
**Why.** Posts are drawn from the ADRs and docs, which are already Markdown in git.
**Alternative.** A hosted blog (Hashnode, Medium). Lost: the content would live on someone else's
domain and layout, and moving it later breaks links.
**Cost.** No web editor; writing a post means a commit.

## P4. Every design post shows how it breaks
**Rule.** A design post covers the concerns most write-ups skip: failure modes, security,
performance, UX, data integrity and cost. Each one it covers states what goes wrong, how it is
detected, the automatic response, the worst case and the test that proves it. Each post is tagged
with the concerns it covers.
**Why.** This is the positioning: an engineer who designs for the breaks, not the happy path. The
research (`reports/Remote engineer portfolio patterns.md`) found trade-off defences and failure
narratives are the posts that show judgement, and that hiring processes like Oxide's ask for
exactly these.
**Alternative.** General engineering posts and tutorials. Lost: they look like every other blog
and show no judgement.
**Cost.** Each post takes longer, and a concern with nothing true to say is left out rather than
padded.
