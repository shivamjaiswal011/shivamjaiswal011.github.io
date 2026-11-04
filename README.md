# portfolio

Personal portfolio and technical writing for Shivam Jaiswal, built with [Astro](https://astro.build).
Published free at `https://shivamjaiswal011.github.io` (see [ADR-0001](docs/decisions/0001-astro-static-site-on-github-pages.md)).

Design pack: [docs/](docs/README.md).

## Prerequisites

Node.js 22.23.4 or newer (Astro 7's minimum) (built and tested on 24.19.0) and npm.

| OS | Install Node |
|---|---|
| macOS | `brew install node` |
| Linux (Debian/Ubuntu) | `curl -fsSL https://deb.nodesource.com/setup_24.x \| sudo -E bash - && sudo apt-get install -y nodejs` |
| Windows | `winget install OpenJS.NodeJS` |

## Install

Same command on macOS, Linux and Windows, from the repo root:

```sh
npm ci
```

Versions are pinned exactly in `package.json` and `package-lock.json`. Add a dependency with
`npm install --save-exact <name>`.

## Run

| Task | Command |
|---|---|
| Dev server at http://localhost:4321 (shows drafts) | `npm run dev` |
| Production build into `dist/` (drafts left out) | `npm run build` |
| Serve the built site locally | `npm run preview` |

The RSS feed is built to `/rss.xml`.

## Write a post

1. Add `src/content/posts/<slug>.md`. The file name becomes the URL: `/posts/<slug>/`.
2. Front matter (checked at build time by `src/content.config.ts`):
   ```yaml
   ---
   title: Keying every quantity by account from day one
   description: One sentence shown in the post list and in link previews.
   published: 2026-11-04
   project: artha-engine     # optional; must match a slug in src/data/projects.ts
   concerns: [failure, data-integrity]  # failure, security, performance, ux, data-integrity, cost
   draft: true               # optional; drafts show in dev, never in the build
   ---
   ```
3. Remove `draft: true` when it is ready, then push.

## Add a project

Edit `src/data/projects.ts`. Posts with a matching `project` are listed on that project's card.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.
One-time setup:

1. Create a public GitHub repo named exactly `shivamjaiswal011.github.io` and push this folder to it.
2. In the repo: Settings → Pages → Source: **GitHub Actions**.

No secrets are needed.
