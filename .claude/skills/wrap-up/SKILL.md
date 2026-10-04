---
name: wrap-up
description: End-of-session checklist for Geekster. Runs the quality gate, updates PLAN.md (tick, fold, archive), fixes every doc the session's changes made wrong, records decisions and writes the commit. Use at the end of every implementation session, before a release, or when the user says "wrap up", "finish the session", "update the docs".
---

# Wrap up an implementation session

Work through these in order. Report at the end what was done, what was skipped and why.

## 1. The gate

Run `npm run verify`. If anything fails, fix it before going on — never commit red. If a fix is
out of scope, stop and tell the user.

## 2. What changed

`git status` and `git diff` (staged and unstaged) against the last commit, or against the session's
starting commit if there are several. List the changes in one line each; this list drives the rest.

## 3. Tests

For each changed rule or bug fix: is there a test that would fail without it (`.claude/rules/testing.md`)?
If not, write it now, or say in the commit why it cannot be tested and how it was checked by hand.

## 4. Docs that are now wrong

Go through the triggers in `.claude/rules/documentation.md` against the change list. For each
hit, fix the **owning** document (its table). Rules:

- Correct the present-tense description; do not append a status sentence
- `CLAUDE.md` only if a stack item, command, convention or invariant changed. Keep it ≤ 250 lines
- New file → `docs/architecture/project-structure.md`. New route → `README.md` § API.
  New script → `README.md` command table and `CLAUDE.md` § Commands
- New `localStorage` key, cookie, third-party request or counter → the privacy page, same commit
- A decision made in the session (by the user or while building) → a row in `docs/decisions.md`

## 5. The plan

In `PLAN.md`:

- Tick finished tasks. A finished work package folds to: ✅, one line of what it does, the commit,
  how it was verified (locally / staging / production)
- Update § Status (≤ 10 lines: production state, now, open hand steps for the user)
- New follow-up work found during the session → a task in the right work package or milestone,
  not a note in the conversation

**If the milestone was released in this session:** move its whole section word for word to
`docs/history/NN-short-name.md` (with the archive header the other files have), add its row to
`docs/history/README.md`, add a `CHANGELOG.md` line, move the next milestone up in `PLAN.md`, and
update `ROADMAP.md`'s Now / Next / Later.

## 6. Commit

- Conventional message: `feat(11a): …`, `fix: …`, `docs: …`, `test: …`, `chore: …`. The body says
  what and why, including what was verified and what is left to the user
- Code and the docs it changed go in the same commit
- Do not push unless the user asked; say what pushing would deploy (`develop` → staging)

## 7. Memory

Save to memory only what the repo cannot hold: a preference the user stated, a tool quirk of this
machine, an access detail. Never project status — that is `PLAN.md`.
