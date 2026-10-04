# Documentation Rules

The documentation is part of the change, not a follow-up task. A change that makes any document
wrong is not finished until the document is right again — in the same commit.

**Docs describe the present; history belongs in git and `docs/history/`.** Correct a document
when it becomes wrong; never append "done on …, then …" status sentences to it. What happened in a
session goes into the commit message, the PR description and, while the milestone is open, its
section in `PLAN.md`.

**Every fact lives in one place.** Other documents link to it instead of repeating it. When you
find the same fact in two places, keep the one in the owning document (table below) and replace
the other with a link.

## Who owns what

| Document                                 | Covers                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                              | Loaded every session: stack, commands, conventions, invariants, the map of docs. ≤ 250 lines |
| `PLAN.md`                                | Status, the current milestone's work packages in full, the next milestones in outline        |
| `ROADMAP.md`                             | Vision, goal and order of the milestones, encyclopedia plan, ideas, risks                    |
| `CHANGELOG.md`                           | One line per production release                                                              |
| `README.md`                              | For a human arriving at the repo: setup, command table, API routes                           |
| `docs/decisions.md`                      | The decision log: date, decision, why                                                        |
| `docs/history/`                          | Finished milestones, moved word for word from `PLAN.md`; `README.md` is the index            |
| `docs/architecture/project-structure.md` | Every file and what it does, config files                                                    |
| `docs/architecture/game-rules.md`        | The game's rules as the player meets them, and where each lives                              |
| `docs/architecture/game-architecture.md` | State machine, the referee's protocol, data flow, key functions                              |
| `docs/architecture/frontend.md`          | Design system, accessibility, legal pages, `<html lang>`                                     |
| `docs/architecture/admin-panel.md`       | The admin panel                                                                              |
| `docs/runbooks/environments.md`          | Stages, hosting, env vars and secrets, blob store, access protection                         |
| `docs/runbooks/release.md`               | Branching, CI, releasing                                                                     |
| `docs/runbooks/schema-migrations.md`     | Generate, review, staging, production, expand/contract, stamping                             |
| `docs/runbooks/adding-games.md`          | How a game gets into the game, database and blob store included                              |
| `.claude/rules/`                         | How to write code, tests and docs here                                                       |

## Triggers

Update the owning document in the same commit whenever the change involves:

- a new or renamed npm script, API route, database table or column, or environment variable
- a new migration in `drizzle/`, or any change to how one is generated or applied
- a new dependency that changes how something is built, stored or deployed
- a moved, added or deleted file that `project-structure.md` lists
- a changed data flow — where data is read from, where images are served from, what the fallback is
- a changed game rule or invariant (also `CLAUDE.md` if it is one of its invariants)
- a decision a later session could undo without knowing why → a row in `docs/decisions.md`
- a completed task or work package → tick it in `PLAN.md`; fold a finished package to a few lines
  (done, commit, how verified)
- a released milestone → move its section from `PLAN.md` to `docs/history/NN-name.md` word for
  word, add its row to `docs/history/README.md`, a line to `CHANGELOG.md`, and update `PLAN.md`
  § Status and `ROADMAP.md`'s Now / Next / Later
- an operational fact the next session cannot rediscover from the code (a store ID, a region, a
  destructive command, a step only the user can perform) → the runbook that owns the topic, not
  `PLAN.md`, which is archived when the milestone ends

## Style

- Present tense, rule first, then one line of why. The story of how it was found goes in the
  commit or `docs/history/`
- No dates or sprint numbers in architecture docs except where a decision ID helps find the why
- Live counts (games, players) are never written down; they change constantly

## Enforcement

- **`/wrap-up`** (`.claude/skills/wrap-up/`) at the end of every implementation session walks
  through the triggers above
- **`.claude/hooks/docs-sync-guard.sh`** runs before `git commit`:
  - **blocks** when `CLAUDE.md` is over 250 lines — move detail into `docs/`
  - if code (`src/`, `scripts/`, `package.json`, the config files, `.env.example`) is staged and no
    document is, or only `PLAN.md` / `CHANGELOG.md` are, the first attempt is blocked with a
    checklist; repeating the same commit lets it through — a prompt to check, not a veto
