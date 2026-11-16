# Agent Instructions

- Read `README.md` for how the app works and `DESIGN.md` before any visual
  change. `DESIGN.md` extends the indrapatil.com design and mirrors the tokens
  in `src/style.css`; update both in the same commit. For documentation
  diagrams, follow `.agents/skills/documentation-illustrations/SKILL.md`.

- Use Vite+ (`vp`) and pnpm. Build the wheels once with `vp run wheels`
  before the first `vp run e2e`.

- The Pyodide version in `package.json` is pinned exactly: the wheels are
  cross-compiled for that release, and `scripts/build-wheels.sh` reads it from
  there. After changing it, or `wheels/requirements.txt`, rebuild the wheels.
  The script also pins `pyodide-build`; upgrade it when a new Pyodide release
  needs a newer one.

- Only offer editor formatting that md2linkedin can express in Unicode; it
  has no style for strikethrough, underline, quotes, or rules.

## Pull request workflow

1. Work on a branch and deliver every change through a ready-for-review PR,
   never a draft.

2. Install the Git hooks once with `prek install`. Before each commit, run
   `prek run --all-files`, `vp run qa`, and `vp run e2e`. Never bypass hooks
   with `--no-verify` or `SKIP`.

3. Use Conventional Commits for every commit and PR title, including merge,
   revert, and fixup messages. Keep the PR title and body in sync with the
   net diff.

4. If the PR touches frontend source (`index.html`, `src/`, or `public/`),
   including behaviour-only changes and refactors with no intended visual
   difference, follow [`pr-screenshot`](.agents/skills/pr-screenshot/SKILL.md)
   and post verified screenshots. Changes limited to developer tooling,
   tests, CI, or docs are exempt.

5. Wait for CI, fix the causes of failures, and push until all required
   checks pass; rerun a job only when it failed for a reason outside the
   change, such as a network error. Then comment `@codex review` unless Codex
   is already reviewing, and address its findings until Codex approves the
   current head with no unresolved threads; an older approval or silence does
   not count. If Codex reports exhausted usage, stop requesting reviews, keep
   fixing CI, leave the PR open, and report the limit.

6. Once CI is green and Codex has approved the current head, recheck the
   head, checks, and threads, then squash-merge with the owner's GitHub
   credentials, respecting branch protection. No further approval is needed
   for this step. Report local checks, hosted CI, review, and merge
   separately.

Open, unmerged PR history may be tidied with
`--force-with-lease=<branch>:<expected-sha>`. Never use bare `--force` or
rewrite `main`, tags, or merged history.

## Demo and screenshots

- After a major UI change (a new or rearranged panel, toolbar, or control,
  not a small tweak), refresh the visuals in their own PRs: re-record
  `docs/images/demo.gif` with `scripts/record-demo.mjs`, and open a parallel
  PR in `IndrajeetPatil/md2linkedin` that replaces `docs/assets/web-app.webp`
  with a 1600×1075 capture of the sample post (a 1100×739 viewport at a
  device scale factor of 16/11).

## Prompts and skills

- Reusable task prompts live in `.github/prompts/`: `address-review`,
  `simplify-codebase`, and `update-deps`.

- `.agents/skills/agent-browser/` is vendored upstream and recorded in
  `skills-lock.json`; update it with the Skills CLI as `update-deps`
  describes, never by hand.

## Gotchas

- Fix failures rather than weakening checks: keep Oxlint's type-aware rules
  and the end-to-end browser projects as they are.

- Never put information in a native `title` attribute: its tooltip is
  hover-only, so keyboard and touch users never see it. Show it visibly or
  give the control an accessible name.

- Never give a secret to a job that installs or runs project dependencies.
  Pin third-party actions by full commit SHA with a version comment.

- Keep `.github/workflows/actions.lock` in sync with the workflows: after any
  `uses:` change, run `vp run actions-lock` (needs the `gh-actions-lock`
  version pinned in `scripts/actions-lock.sh`). Never edit it by hand.

- Use British English in user-facing text, and the serial (Oxford) comma in
  every list of three or more items in docs, comments, commit messages, PR
  text, and user-facing copy.
