# Documentation illustrations

## How the app works

The diagram in the README was generated with the image generation tool. Its
labels and flows were checked against the README.

```text
Use case: infographic-diagram. Asset type: documentation diagram for the
LinkedIn Post Formatter. Landscape 3:2, flat canvas warm paper #faf8f4, ink
#201d18, muted ink #5d574c, fine hairlines #e3ded2, sparse teal #14584d only
to highlight the conversion path, not broad fills. Large Fraunces-like serif
title and band headings, Hanken-like sans labels, generous whitespace, flat
outline icons, thin orthogonal arrows. Match a restrained editorial style of
warm-paper technical figures: crisp, calm, readable, no cards, no enclosing
panels. No shadows, gradients, texture, 3D, emoji, decorative footer, ordinal
numbers, or invented values. Title exactly 'How formatting reaches
LinkedIn'. Make three horizontal bands separated by hairlines. First band
heading 'Write and convert', summary 'Formatting becomes Unicode text in the
browser.' Flow, left to right: 'Tiptap editor' → 'Markdown' → 'Web Worker' →
'md2linkedin.convert()' → 'LinkedIn text'. Use simple accurate outline icons
for editor, document, worker process, and text output. Second band heading
'Python runtime', summary 'The worker loads Pyodide from jsDelivr.' Flow:
'jsDelivr' → 'Pyodide runtime' → 'Web Worker'. Third band heading
'WebAssembly wheels', summary 'Three wheels are bundled with the page.' Flow:
'md2linkedin' · 'comrak (Rust)' · 'selectolax (C)' → 'WebAssembly wheels'
→ 'Web Worker'. Include small muted note 'Cross-compiled for the pinned
Pyodide release' under the wheel flow. Make the Web Worker in each dependency
band visually connect to the same central worker node conceptually, with clear
arrows. Keep flows distinct, labels spelled exactly as provided, avoid adding
unsupported facts. The output must be a clean infographic with generous
breathing room and no ambiguous arrows.
```

Edit prompt:

```text
Preserve every element, position, arrow route, icon, label, spacing,
background colour, and text exactly. Make only this change: recolour the
arrows in the 'Python runtime' band and the 'WebAssembly wheels' band from
teal to muted ink #5d574c, including their connector arrows into the worker.
Keep the arrows in the 'Write and convert' band teal #14584d. Keep all
hairline separators #e3ded2 and all text and icons in their current colours.
No other changes.
```
