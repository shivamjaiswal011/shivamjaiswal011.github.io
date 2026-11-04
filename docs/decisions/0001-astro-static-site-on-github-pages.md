# ADR-0001: Astro static site on GitHub Pages, no domain yet
Status: proposed
Date: 2026-11-04

## Context
Job applications to remote companies ask for a website. The projects to show are private repos
(P1), and the posts come from Markdown ADRs (P3). Buying a domain is deferred for now.

## Options
1. **Astro, static, on GitHub Pages at `shivamjaiswal011.github.io`.** Markdown posts are
   type-checked content collections; ships plain HTML with no JavaScript by default. Free, no
   server. Cost: the URL changes if a domain is added later.
2. **Next.js on Vercel (`*.vercel.app`).** Same React stack as the day job. Cost: more framework
   than a content site needs, and still a subdomain.
3. **Hosted blog (Hashnode) plus a link list.** Zero build work. Cost: content and layout owned by
   the platform (see P3).

## Decision
Option 1.

## Why
A static content site is what Astro is built for, Pages costs nothing, and `github.io` looks
credible to engineers on an application form.

## Consequences
- Pushing to `main` deploys (`.github/workflows/deploy.yml`).
- The repo must be public and named `shivamjaiswal011.github.io`. Only the site's source is public,
  not the projects.

## Open items
- When to buy a domain. Buying before the first post is shared widely avoids broken links; after,
  it needs a redirect from the `github.io` URL.

## Assumptions
- GitHub Pages stays free for public repos. Breaks if wrong: hosting moves to Netlify or Cloudflare
  Pages; the build is unchanged.

## Revisit when
A domain is bought, or the site needs a server (forms, comments).
