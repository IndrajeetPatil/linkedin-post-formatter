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

## Learn from mistakes

When a check fails, a reviewer raises a finding, or you notice a mistake in
your own work, fix it, then ask what led you to it. If `AGENTS.md`, a skill,
its scripts or templates, a prompt, or a doc gave missing, ambiguous, or
wrong guidance, correct that guidance in the same pull request, stating the
general rule rather than the incident. Never weaken a quality gate instead.

## Pull requests

Follow these rules without relying on any instructions outside this
repository:

- Write every commit message and PR title as a Conventional Commit,
  `type(scope): description`, lowercase and imperative, with an allowed type
  (`build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`,
  `revert`, `style`, `test`). Keep the PR title and body in sync with the
  net diff.

- Open every PR ready for review with `gh pr create`, never as a draft.

- Never add agent or tool attribution to commits, PRs, or comments.

- If the PR touches frontend source (`index.html`, `src/`, or `public/`),
  including behaviour-only changes and refactors with no intended visual
  difference, follow [`pr-screenshot`](.agents/skills/pr-screenshot/SKILL.md)
  and post verified screenshots. Changes limited to developer tooling,
  tests, CI, or docs are exempt.

- After opening or pushing, wait for hosted CI to finish. Inspect failed jobs,
  fix the cause, run the local checks (`vp run qa`, `vp run e2e`, and
  `prek run --all-files`), push, and repeat. Skipped, queued, or failing
  required checks are not success.

- If an automatic AI review (Codex, for the owner) runs on the PR, wait for
  its result instead of requesting one. Fix merited findings, reply to and
  resolve addressed threads, and continue until the review approves the
  current head with no unresolved findings. Never write `@codex` anywhere in
  a PR, even in backticks: it cancels the automatic review. Say "a Codex
  review request" instead.

- If Codex reports exhausted usage, keep fixing CI, leave the PR open, and
  report the limit. Once usage refreshes, comment `@codex review` once; only
  this case needs the comment.

- Once CI is green and the review gate is met, squash-merge, then verify the
  merged state. Recheck the head, threads, and checks immediately before
  merging, and never bypass branch protections.

- Update a PR branch from `main` only to resolve conflicts or pick up a change
  the PR depends on, never just to bring it up to date. Open, unmerged PR
  history may be tidied with `--force-with-lease=<branch>:<expected-sha>`.
  Never use bare `--force` or rewrite `main`, tags, or merged history.

- Report local validation, hosted CI, review, and merge state separately. If
  an external blocker stops completion, leave the PR open and say so.

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
  First-party reusable workflows from `IndrajeetPatil/workflows` stay on
  `@main` by design; don't pin them.

- Keep `.github/workflows/actions.lock` in sync with the workflows: after any
  `uses:` change, run `vp run actions-lock` (needs the `gh-actions-lock`
  version pinned in `scripts/actions-lock.sh`). Never edit it by hand.

- Use British English in user-facing text, and the serial (Oxford) comma in
  every list of three or more items in docs, comments, commit messages, PR
  text, and user-facing copy.
