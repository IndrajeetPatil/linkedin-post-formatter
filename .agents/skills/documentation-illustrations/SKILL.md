---
name: documentation-illustrations
description: >
  Create or revise informative diagrams and illustrations for this app's
  documentation. Use when a user asks for generated docs artwork or diagrams.
---

# Documentation illustrations

Everything this skill needs is in this repository: the design rules in
`DESIGN.md`, the app and README, and figures in `docs/images/`. Do not look
for external references or prompts.

## Inputs

- **Design rules:** read the documentation-illustration section and the colour
  and typography tokens in `DESIGN.md`.
- **Visual references:** open existing raster figures in `docs/images/` and
  match the one closest to the new subject.
- **Prior prompts:** reuse the structure of prompts recorded in
  `docs/illustrations.md`.
- **Facts:** the guide the figure illustrates is the only source of labels,
  controls, values, and flows.

## House style

Map the `DESIGN.md` tokens into the prompt by value, reading them fresh each
time rather than copying them from an older prompt:

| Element                                         | Token        |
| ----------------------------------------------- | ------------ |
| Canvas                                          | `bg`         |
| Title, headings, icons, primary labels          | `text`       |
| Explanatory labels, arrows                      | `text-muted` |
| Separators and hairlines                        | `border`     |
| The control or path being explained (sparingly) | `accent`     |
| Denials, failures, threats                      | `chip-rust`  |

- Use a landscape composition with a large Fraunces-like serif title and
  Hanken-like sans labels.
- Use a clear, content-appropriate arrangement with hairline separators and
  enough whitespace for every label to remain legible.
- Use flat outline icons in ink; service marks only where they identify a real
  actor, kept accurate and secondary to the labels.
- Keep arrows thin and directional; branches split cleanly and never cross.
- Do not use shadows, gradients, texture, 3D, cards, emoji, decorative
  footers, ordinal numbering, invented statistics, hostnames, credentials, or
  account values.

## Prompt template

Fill every bracket from the guide and `DESIGN.md`; drop lines that do not
apply.

```text
Use case: infographic-diagram. Asset type: documentation diagram for the
LinkedIn post formatter. Landscape 3:2, flat canvas [bg], ink [text], muted
ink [text-muted], fine hairlines [border], sparse accent [accent] for [the
controls being explained], muted rust [chip-rust] only for [denials or threats].
Fraunces-like serif title and headings, Hanken-like sans labels, generous
whitespace, outline icons, thin directional arrows. No shadows, gradients,
texture, 3D, cards, emoji, ordinal numbering, or invented values. Title
exactly '[title]'. Show '[flow or relationship]' using the exact labels
'[label]', '[label]', and '[label]'. [Branches and boundaries that must stay
distinct.] Verify arrow directions and spelling.
```

For a follow-up edit, state what to preserve (every element, position, arrow,
icon, colour, and other label) and the single change to make.

## Check the result

- View the image at documentation width. Verify every label, arrow direction,
  branch, and boundary against the guide; regenerate or edit if text is
  misspelled, icons mislead, labels are cramped, or the hierarchy departs from
  the references.
- Keep caveats and detail in Markdown; the image summarises, it does not
  replace searchable text.

## Asset and documentation

- Use the agent's image generation tool. Without one, draw simple diagrams as
  hand-written SVG using the same tokens, or stop and ask.
- Save raster output as WebP in `docs/images/` with a kebab-case name, and
  embed it with alt text that states what the diagram shows.
- Keep the final prompt and any edit prompts in `docs/illustrations.md`.
- Change `DESIGN.md` only when the shared illustration rules change.
