# Visual design

**Goal.** The site itself is a UI work sample: sleek, modern, quiet. Reference for the visual
language (not the brand): https://paper.design, inspected 2026-11-04.

## What we took from the reference, measured

| Element | Reference (computed style) | Ours |
|---|---|---|
| Background | `lab(8.2 0 0)` ≈ `#151515`, dark only | `#141414` |
| Text | `lab(94.2 -1.4 5.3)`, warm off-white | `#eeece6` |
| Body font | Matter (paid), 18px / 28px, tracking +0.01em | Geist Variable, same size and line height |
| Headline | 56px, weight 360, tracking -0.02em, line height 1.0; second line in grey | same, `clamp()` down to 36px on phones |
| Nav | lowercase words, no underline | same |
| Product shots | inside a desktop-app window frame | project cards drawn as app windows |
| Background art | thin diagonal drafting lines | faint square grid, faded at the edges |

## Decisions

- **Homepage opens with a bio, not a hero.** Name, a one-line position in the quiet grey, and a
  short bio, with no buttons. The research found strong engineer sites open with a bio and go
  straight to writing; the nav already links to writing and projects. Alternative: a slogan hero
  with calls to action, as on product sites. Lost: it reads as marketing.
- **Reading pages centre their column.** Posts and the about page sit in one 42rem column in the
  middle of the page, as on Medium; the header, homepage and lists stay full width. Alternative:
  left-aligned under the logo. Lost: on wide screens it left half the page empty on the right.
- **Dark only.** Matches the reference and keeps one palette to maintain. Alternative: light and
  dark themes. Lost: twice the colour checking for a site with one author. Revisit if readers ask.
- **Geist, self-hosted from npm (`@fontsource-variable/geist`, `geist-mono`).** Free, variable
  weight (so 360 works), closest free match to Matter. Alternative: Google Fonts link. Lost: a
  third-party request on every page view. Cost: two pinned dependencies.
- **Mono for metadata** (dates, stacks, file-like labels): reads as "engineer" and separates
  facts from prose.

## Accessibility

Muted text `#8f8e88` on `#141414` is about 5.6:1 (WCAG AA needs 4.5:1). Focus rings are visible.
Grid lines are decoration only (`aria-hidden`).

## Assumptions

- A1: Geist is a close enough substitute for Matter. Breaks if wrong: the site looks generic, not
  like the reference. Status: Unverified, judged by eye after the build.
