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
