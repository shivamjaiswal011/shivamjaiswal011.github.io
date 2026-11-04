# portfolio design pack

**The one rule:** every post and project page must be readable by someone who will never see the
private code.

## Reading order

| Doc | Status |
|---|---|
| [00-principles.md](00-principles.md) | Draft for review |
| [01-visual-design.md](01-visual-design.md) | Draft for review |
| [decisions/](decisions/README.md) | ADR-0001 proposed |

## Questions for the review

- Q1. Which projects go on the site first? Scaffolded with Tracktions and artha-engine. Changes the
  front page and which posts get written first.
- Q2. Is anything in Tracktions or artha-engine off-limits for posts (strategy, broker details,
  family accounts, revenue)? Decides what P2 removes before publishing.

## Glossary

- **Post**: a Markdown file in `src/content/posts/`, published at `/posts/<slug>/`.
- **Draft**: a post with `draft: true`. Shown by `npm run dev`, left out of `npm run build`.
- **Project**: an entry in `src/data/projects.ts`. A post links to it through its `project` field.

## Open items

- [ADR-0001](decisions/0001-astro-static-site-on-github-pages.md#open-items): when to buy a domain.
