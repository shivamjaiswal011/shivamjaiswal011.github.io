# portfolio design pack

**The one rule:** every post and project page must be readable by someone who will never see the
private code.

## Reading order

| Doc | Status |
|---|---|
| [00-principles.md](00-principles.md) | Draft for review |
| [01-visual-design.md](01-visual-design.md) | Draft for review |
| [02-writing-plan.md](02-writing-plan.md) | Draft for review |
| [decisions/](decisions/README.md) | ADR-0001 proposed |

## Questions for the review

- Q1. Which projects go on the site first? Scaffolded with Tracktions and artha-engine. Changes the
  front page and which posts get written first.
- Q2. Is anything in Tracktions or artha-engine off-limits for posts (strategy, broker details,
  family accounts, revenue)? Decides what P2 removes before publishing.
- Q3. May posts name the brokers and data vendors (Dhan, Fyers)? Post 1 avoids them for now.

## Glossary

- **Post**: a Markdown file in `src/content/posts/`, published at `/posts/<slug>/` and in the RSS feed
  at `/rss.xml`.
- **Read time**: words in the post divided by 220, rounded up.
- **Draft**: a post with `draft: true`. Shown by `npm run dev`, left out of `npm run build`.
- **Concern**: one of the quality areas a post covers (failure modes, security, performance, UX,
  data integrity, cost); listed in [02-writing-plan.md](02-writing-plan.md#concerns).
- **Project**: an entry in `src/data/projects.ts`. A post links to it through its `project` field.

## Open items

- [02-writing-plan.md](02-writing-plan.md#open-items): which Tracktions decision anchors post 4.
- [ADR-0001](decisions/0001-astro-static-site-on-github-pages.md#open-items): when to buy a domain.
