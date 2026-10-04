#!/usr/bin/env bash
# PreToolUse/Bash guard before `git commit`.
#
# 1. Blocks (every time) a commit while CLAUDE.md is over its line budget — it is loaded into
#    every session, and detail belongs in docs/.
# 2. Blocks the FIRST attempt for a given set of staged files when code is staged without any
#    document, or with only PLAN.md / CHANGELOG.md (a status line is not a doc update), and
#    prints a checklist. The same set staged again goes through — so a change that genuinely
#    needs no documentation costs one extra round, not an argument.
set -uo pipefail

CLAUDE_MD_MAX_LINES=250

payload=$(cat)
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

case "$command" in
	*"git commit"*) ;;
	*) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null || exit 0

# 1. CLAUDE.md budget — the working-tree file, because a combined `git add … && git commit`
#    stages it only after this hook has run.
claude_lines=$(wc -l < CLAUDE.md 2>/dev/null | tr -d ' ')
if [ -n "$claude_lines" ] && [ "$claude_lines" -gt "$CLAUDE_MD_MAX_LINES" ]; then
	cat >&2 <<MSG
Docs-sync guard: CLAUDE.md has $claude_lines lines, over the budget of $CLAUDE_MD_MAX_LINES.

It is loaded into every session. Move detail into the owning document under docs/ (see the
table in .claude/rules/documentation.md) and keep a one-line pointer in CLAUDE.md.
MSG
	exit 2
fi

staged=$(git diff --cached --name-only 2>/dev/null) || exit 0
[ -n "$staged" ] || exit 0

# 2. Code staged without a real doc update.
# Files that change what the documentation claims to describe.
code=$(printf '%s\n' "$staged" | grep -E '^(src/|scripts/|drizzle/|package\.json|svelte\.config\.js|vite\.config\.ts|drizzle\.config\.ts|\.env\.example)' || true)
# Files that ARE the documentation, minus the plan and the changelog.
docs=$(printf '%s\n' "$staged" | grep -E '^(CLAUDE\.md|ROADMAP\.md|README\.md|docs/|\.claude/(rules|skills)/)' || true)

[ -n "$code" ] || exit 0
[ -z "$docs" ] || exit 0

# Second attempt with an identical staged set is allowed through.
marker_dir="${TMPDIR:-/tmp}/claude-docs-sync-guard"
mkdir -p "$marker_dir"
find "$marker_dir" -type f -mmin +120 -delete 2>/dev/null
marker="$marker_dir/$(printf '%s' "$staged" | shasum | cut -d' ' -f1)"
[ ! -f "$marker" ] || exit 0
: > "$marker"

cat >&2 <<MSG
Docs-sync guard: this commit changes the project but updates no documentation
(PLAN.md and CHANGELOG.md alone don't count — they record status, not how things work).

Staged without a doc change:
$(printf '%s\n' "$code" | sed 's/^/  /')

Run through the triggers in .claude/rules/documentation.md (or /wrap-up) and fix the owning doc:
  docs/architecture/      project-structure, game-rules, game-architecture, frontend, admin-panel
  docs/runbooks/          environments, release, schema-migrations, adding-games
  docs/decisions.md       a decision a later session could undo without knowing why
  README.md               setup, command table, API routes
  CLAUDE.md               only for a stack item, command, convention or invariant
  .claude/rules/          coding, testing and documentation rules

If nothing needs changing, run the same commit again and it will go through.
MSG
exit 2
