---
version: alpha
name: LinkedIn post formatter
description: >-
  A LinkedIn post formatter in the indrapatil.com identity — warm paper, ink,
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

The visual design of the LinkedIn post formatter. It follows the visual
identity of [indrapatil.com](https://www.indrapatil.com/) (the base), last
reconciled on 2026-11-15. Everything in that identity applies here unless this
file records a choice or an addition below.

The tokens above mirror `src/style.css`, which is normative; when either
changes, update the other in the same commit. They are the base values
unchanged.

## Overview

One page, two facing panels: the post as the writer formats it, and the
LinkedIn text it becomes. Everything else stays out of the way — a title, one
sentence of explanation, and a colophon.

## Choices

| Base parameter | Choice here                                                                                                                                | Why                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Accent         | Teal-green, the base default                                                                                                               | Nothing about the subject calls for another accent.                                                            |
| Paper and ink  | The base values, unchanged, in both modes                                                                                                  | —                                                                                                              |
| Chip hues      | Rust only, for errors and an over-long post                                                                                                | The app has no taxonomy.                                                                                       |
| Dark mode      | Supported: the base dark set as `light-dark()` tokens, following the system setting until the reader overrides it with the masthead toggle | Posts get written late in the evening as often as at a desk.                                                   |
| Type scale     | `title` from 2rem on phones to the base maximum; `heading` lowered to 1.4rem; no `display`                                                 | Panel headings label tools, not chapters, and the title shares its row with two icon buttons on a 320px phone. |
| Width          | `max-w-6xl` (72rem)                                                                                                                        | Two panels side by side from 64rem.                                                                            |
| Density        | Toolbar buttons at 36px, 32px on phones narrower than 26rem                                                                                | Dense secondary controls that keep one row on a 360px phone; the copy button and options keep 44px.            |

## Additions

- **Post preview:** set in the system face at 14px, as LinkedIn sets posts,
  so the Unicode styles show as readers will see them. This is the only text
  outside the two base families.
- **Formatting toolbar:** a `role="toolbar"` row of icon buttons with one tab
  stop. Toggles show their state with `aria-pressed`: an 8% accent tint and a
  40% accent outline. Tooltips name the action and its keyboard shortcut.
- **Character count:** a `.folio-mark` beside the preview heading; past
  LinkedIn's 3,000-character limit it turns rust and says so in words.

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
