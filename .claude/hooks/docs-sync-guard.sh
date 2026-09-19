#!/usr/bin/env bash
# PreToolUse/Bash guard: stop a commit that changes how the project works without
# touching any of the documents that describe it.
#
# Blocks the FIRST attempt for a given set of staged files and prints a checklist.
# If the same set is staged again, the commit goes through — so a change that
# genuinely needs no documentation costs one extra round, not an argument.
set -uo pipefail

payload=$(cat)
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

case "$command" in
	*"git commit"*) ;;
	*) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null || exit 0

staged=$(git diff --cached --name-only 2>/dev/null) || exit 0
[ -n "$staged" ] || exit 0

# Files that change what the documentation claims to describe.
code=$(printf '%s\n' "$staged" | grep -E '^(src/|scripts/|package\.json|svelte\.config\.js|vite\.config\.ts|drizzle\.config\.ts|\.env\.example)' || true)
# Files that ARE the documentation.
docs=$(printf '%s\n' "$staged" | grep -E '^(CLAUDE\.md|SPRINTS\.md|README\.md|\.claude/(docs|rules)/)' || true)

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
Docs-sync guard: this commit changes the project but updates no documentation.

Staged without any doc change:
$(printf '%s\n' "$code" | sed 's/^/  /')

Check each of these and update the ones that are now wrong or incomplete:
  CLAUDE.md               tech stack, project structure, commands, conventions, sprint progress
  SPRINTS.md              user stories and tech tasks of the current sprint; ground rules for the next
  README.md               stack, setup, command table, API routes
  .claude/docs/           project-structure.md, game-architecture.md, adding-games.md
  .claude/rules/          code-style.md, quality-checks.md, svelte5-runes.md

Typical triggers: a new npm script, route, table, env var or dependency; a changed
deployment target, data flow or file layout; a completed sprint task.

If nothing needs changing, run the same commit again and it will go through.
MSG
exit 2
