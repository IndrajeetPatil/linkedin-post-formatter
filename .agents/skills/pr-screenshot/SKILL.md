---
name: pr-screenshot
description: >
  Capture screenshots of this app and post them to the current GitHub pull
  request. Invoke whenever opening or updating a PR that changes frontend
  source, including behaviour-only edits and nonvisual refactors;
  developer-tooling-only changes are exempt. Also use for requested PR evidence.
allowed-tools: >
  Bash(gh:*), Bash(curl:*), Bash(agent-browser:*), Bash(lsof:*),
  Bash(vp:*), Bash(sleep:*), Bash(seq:*), Bash(date:*), Bash(mktemp:*),
  Bash(cat:*), Bash(kill:*)
---

# pr-screenshot

Posts screenshots of the production build to the active pull request. They
are captured with agent-browser and uploaded to GitHub's native attachment
storage (`github.com/user-attachments/…`) with `gh pr comment --attach`
(gh ≥ 2.99.0), so no web login or release asset is needed.

## Required invocation

- Post screenshots whenever opening or updating a PR that changes frontend
  source (`index.html`, `src/`, or `public/`), even when no visual difference
  is intended. Changes limited to developer tooling, tests, CI, or docs are
  exempt.

- Capture every affected state at desktop (1280×720) and phone (390×844)
  widths, in dark mode too when colours or new elements are involved. For
  existing UI, show before and after side by side. When the appearance is
  meant to be unchanged, say so.

- Verify that the posted comment shows uploaded images. A local PNG or an
  unverified upload is not completion: fix the upload, or report the blocker
  and leave the requirement outstanding.

- Refresh the screenshots after further frontend edits.

## Hard rules

- Never commit screenshots or push them to any branch, gist, release, or
  external image host. GitHub's attachment storage is the only destination.

- Screenshots live in a temporary directory only.

- Use only the sample post or invented text, never real drafts.

## Workflow

### 1. Find the PR

```bash
PR_NUMBER=$(gh pr view --json number -q '.number')
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
```

If this fails, open the PR first.

### 2. Build and preview under the Pages base path

The wheels must exist (`vp run wheels` once). Build and preview with the same
base path GitHub Pages uses; without `PAGES_BASE` the page loads unstyled.

```bash
export PAGES_BASE=/linkedin-post-formatter/
vp build
lsof -ti:4173 | xargs kill 2>/dev/null
vp preview --port 4173 --strictPort > /dev/null 2>&1 &
URL="http://localhost:4173${PAGES_BASE}"
for i in $(seq 1 30); do curl -sf "$URL" > /dev/null && break; sleep 1; done
```

For a "before" capture, build `main` in a separate worktree the same way and
preview it on another port.

### 3. Capture

Wait for the LinkedIn text pane to fill: Pyodide loads the converter, which
takes a few seconds.

```bash
SHOT_DIR=$(mktemp -d /tmp/pr-screenshots.XXXXXX)

agent-browser set viewport 1280 720
agent-browser open "$URL"
agent-browser wait --text "/ 3,000"
agent-browser screenshot "$SHOT_DIR/desktop.png"

agent-browser set viewport 390 844
agent-browser open "$URL"
agent-browser wait --text "/ 3,000"
agent-browser screenshot "$SHOT_DIR/mobile.png"
```

Drive the UI first for interactive states (`agent-browser snapshot -i`, then
act on the refs it returns), and use `--full` for full-page captures. For dark
mode, click "Switch to dark theme" before capturing.

### 4. Post the comment

`--attach '<path>#<alt text>'` uploads each file and replaces references to
the same path in the body with the uploaded URL. Start the comment with
`## Snapshots`; step 5 relies on it.

```bash
gh pr comment "$PR_NUMBER" \
  --attach "$SHOT_DIR/desktop.png#Desktop" \
  --attach "$SHOT_DIR/mobile.png#Phone" \
  --body "$(cat <<EOF
## Snapshots

| Desktop | Phone |
|---|---|
| ![Desktop]($SHOT_DIR/desktop.png) | ![Phone]($SHOT_DIR/mobile.png) |

Captured from the production build, $(date -u '+%Y-%m-%d %H:%M UTC')
EOF
)"
```

Then open the comment (`gh pr view "$PR_NUMBER" --comments`) and confirm every
image link points to `github.com/user-attachments/`.

### 5. Minimise superseded snapshot comments

```bash
gh api --paginate "repos/${REPO}/issues/${PR_NUMBER}/comments" \
  --jq '[.[] | select(.body | startswith("## Snapshots"))][:-1] | .[].node_id' |
while read -r NODE_ID; do
  gh api graphql -f id="$NODE_ID" -f query='mutation($id: ID!) {
    minimizeComment(input: {subjectId: $id, classifier: OUTDATED}) {
      minimizedComment { isMinimized }
    }
  }'
done
```

Only comments starting with `## Snapshots` are touched, and the newest stays
visible.

### 6. Clean up

```bash
lsof -ti:4173 | xargs kill 2>/dev/null
```

## Troubleshooting

| Symptom                                         | Fix                                                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `unknown flag: --attach`                        | Upgrade GitHub CLI to 2.99.0 or later.                                                       |
| Image missing from the table                    | The body path did not match the `--attach` path; unreferenced files are appended at the end. |
| Page unstyled or blank                          | Build and preview with `PAGES_BASE` set, and open the URL with the base path.                |
| LinkedIn text stuck on "Loading the formatter…" | Run `vp run wheels`, then rebuild.                                                           |
| `Port 4173 is already in use`                   | A previous preview or `vp run e2e` server is still running; kill it as in step 6.            |
