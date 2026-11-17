---
version: alpha
name: LinkedIn Post Formatter
description: >-
  A LinkedIn Post Formatter in the indrapatil.com identity — warm paper, ink,
  Fraunces headings, one teal accent, and flat hairline panels, with the
  editor and the LinkedIn text set side by side like facing pages.
colors:
  primary: "{colors.accent}"
  bg: "#faf8f4"
  bg-alt: "#f2efe8"
  surface: "#fdfcf9"
  text: "#201d18"
  text-muted: "#5d574c"
  accent: "#14584d"
  accent-light: "#0e7466"
  border: "#e3ded2"
  chip-rust: "#9a3d2e"
  bg-dark: "#171410"
  bg-alt-dark: "#1d1a15"
  surface-dark: "#211d17"
  text-dark: "#ede8de"
  text-muted-dark: "#a9a294"
  accent-dark: "#86bfa4"
  accent-light-dark: "#a9d3bb"
  border-dark: "#3a352c"
  chip-rust-dark: "#e8a290"
typography:
  title:
    fontFamily: Fraunces Variable
    fontSize: 3.75rem
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.015em
  heading:
    fontFamily: Fraunces Variable
    fontSize: 1.4rem
    fontWeight: 600
    lineHeight: 1.15
  body:
    fontFamily: Hanken Grotesk Variable
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  post:
    fontFamily: system-ui
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.45
rounded:
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
components:
  page:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
---

# DESIGN.md

The visual design of the LinkedIn Post Formatter. It follows the visual
identity of [indrapatil.com](https://www.indrapatil.com/) (the base), last
reconciled on 2026-11-15. Everything in that identity applies here unless this
file records a choice or an addition below.

The tokens above mirror `src/style.css`, which is normative; when either
changes, update the other in the same commit. They are the base values
unchanged.

## Overview

One page, two facing panels: the post as the writer formats it, and the
LinkedIn text it becomes. Everything else stays out of the way — a title, one
sentence of explanation, and links to the privacy notice and the source.

## Choices

| Base parameter | Choice here                                                                                                                                | Why                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Accent         | Teal-green, the base default                                                                                                               | Nothing about the subject calls for another accent.                                                              |
| Paper and ink  | The base values, unchanged, in both modes                                                                                                  | —                                                                                                                |
| Chip hues      | Rust only, for errors and an over-long post                                                                                                | The app has no taxonomy.                                                                                         |
| Dark mode      | Supported: the base dark set as `light-dark()` tokens, following the system setting until the reader overrides it with the masthead toggle | Posts get written late in the evening as often as at a desk.                                                     |
| Type scale     | `title` from 2rem on phones to the base maximum; `heading` lowered to 1.4rem; no `display`                                                 | Panel headings label tools, not chapters, and the title shares its row with three icon buttons on a 320px phone. |
| Width          | `max-w-6xl` (72rem)                                                                                                                        | Two panels side by side from 56rem.                                                                              |
| Density        | Toolbar buttons at 36px, 32px on phones narrower than 26rem                                                                                | Dense secondary controls that keep one row on a 360px phone; the copy button and options keep 44px.              |

## Additions

- **Post preview:** set in the system face at 14px, as LinkedIn sets posts,
  so the Unicode styles show as readers will see them. This is the only text
  outside the two base families.

- **Formatting toolbar:** a `role="toolbar"` row of icon buttons with one tab
  stop. Toggles show their state with `aria-pressed`: an 8% accent tint and a
  40% accent outline. Tooltips name the action and its keyboard shortcut.

- **Clear buttons:** two 32px icon buttons at the end of the editor's
  heading, opposite the character count, overhanging the heading line so both
  panels stay level. Clear formatting turns the selection, or the whole post
  when nothing is selected, into plain paragraphs; the trash icon clears the
  post. Both dim to 40% and do nothing while the post is empty.

- **Options bar:** the post's options and copy button head its panel, as
  the toolbar heads the editor's. The copy button is a 44px square icon whose
  accessible name is "Copy text"; the bubble beside it confirms the copy in
  words. "Styled letters", on by default, comes first: turned off, the post
  keeps its paragraphs and lists without Unicode styles, and "Monospace code"
  is disabled and muted. On narrow screens the options wrap among
  themselves, so the copy button stays at the end of the bar. Side by side, the panes share rows through
  subgrid, so the two bars take one height and the editor and the post start
  on the same line.

- **Styles note:** a muted 13px line under the post panel says that screen
  readers may misread styled letters. It describes the "Styled letters"
  checkbox, stays visible so nobody has to hover to read it, and shares the
  pane's last row with the error banner.

- **Character count:** a `.folio-mark` beside the preview heading; past
  LinkedIn's 3,000-character limit it turns rust and says so in words.

- **Fit to the window:** with two panels side by side and at least 36rem of
  height, the page is exactly the window's height. A compact masthead leaves
  the rest to the panels, and a long post scrolls inside its panel, so the
  copy button never drops below the fold.

- **Privacy notice:** `privacy/index.html`, linked by a shield icon button
  first in the masthead's actions. It shares the masthead, with a link back
  to the formatter in place of the icon, and sets its sections in a single
  42rem column divided by hairlines, with `heading` titles.

- **Page edges:** the page never scrolls sideways, down to a 320px phone, and
  `overscroll-behavior: none` on `html` and `body` stops rubber-band bouncing
  from exposing empty canvas past the top and bottom edges.

- **Post headings:** the post's heading levels 1 to 3 are drawn as `h3` to
  `h5` under the "Write" heading, so the page keeps a single `h1`: Fraunces
  at 1.5rem and 1.25rem, then the body face at 1rem.

- **Browser chrome:** `theme-color` is the paper colour of the system scheme,
  `bg` in light and `bg-dark` in dark; the masthead toggle does not change it.

## Social card

`public/social-card.png` is the 1200×630 image that link previews show.
`scripts/social-card.mjs` renders it from the light tokens and the bundled
fonts:

- warm paper (`bg`), the ¶ mark in the accent, and `www.indrapatil.com` in
  muted ink;

- the title in Fraunces at 84px and weight 600, with one line of body text
  below it;

- the two facing panels as flat `surface` boxes with hairline borders and a
  single teal arrow between them. The left shows the editor's bold, italic,
  and code; the right shows md2linkedin's actual output for it.

There is no dark variant, because a link preview has one image. Keep the text
large enough to read at the 400px width that feeds often show.

## Dark mode

- **Switching:** a two-state icon button beside the GitHub link shows the
  action it takes (a moon while the page is light, a sun while dark). It sets
  `<meta name="color-scheme">` to `light` or `dark`, which CSS maps to
  `color-scheme`, so every `light-dark()` token follows. Choosing the
  system's own scheme clears the override instead of pinning it.

- **Persistence:** the override lives in `localStorage`
  (`linkedin-post-formatter:color-scheme`), and an inline script in
  `index.html` applies it before first paint. Without JavaScript the page
  follows the system.

## Drift

- Dark mode switches through `color-scheme` and `light-dark()` rather than
  the base's `.dark` class, so it also works before any script runs.

## Documentation illustrations

Documentation diagrams use the palette and typography above: warm paper
(`#faf8f4`), ink (`#201d18`), muted ink (`#5d574c`), hairlines
(`#e3ded2`), and sparse teal accent (`#14584d`). Use Fraunces-like serif
titles and Hanken-like sans labels. Keep diagrams flat, legible, and
content-specific, with thin directional arrows and outline icons. Preserve
explanatory details in searchable Markdown. Avoid shadows, gradients, texture,
3D, cards, decorative footers, emoji, and invented facts.
