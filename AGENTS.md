# Agent Instructions

- Read `README.md` for how the app works and `DESIGN.md` before any visual
  change. `DESIGN.md` extends the indrapatil.com design and mirrors the tokens
  in `src/style.css`; update both in the same commit.
- Use Vite+ (`vp`) and pnpm. Before committing, run `vp check` and, after
  building the wheels once with `vp run wheels`, `vp run e2e`.
- The Pyodide version in `package.json` is pinned exactly: the wheels are
  cross-compiled for that release, and `scripts/build-wheels.sh` reads it from
  there. After changing it, or `wheels/requirements.txt`, rebuild the wheels.
  The script also pins `pyodide-build`; upgrade it when a new Pyodide release
  needs a newer one.
- Only offer editor formatting that md2linkedin can express in Unicode; it
  has no style for strikethrough, underline, quotes, or rules.
