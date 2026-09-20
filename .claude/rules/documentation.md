# Documentation Rules

The documentation is part of the change, not a follow-up task. A change that makes any of
these documents wrong is not finished until the document is right again — in the same commit.

## Who owns what

| Document                            | Covers                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `CLAUDE.md`                         | Tech stack, project structure, command list, conventions, game logic, sprint progress            |
| `SPRINTS.md`                        | User stories and tech tasks per sprint, architecture decisions, ground rules for the next sprint |
| `README.md`                         | Stack, setup, command table, API routes — written for a human arriving at the repo               |
| `.claude/docs/project-structure.md` | Full file tree, config files, deployment target                                                  |
| `.claude/docs/game-architecture.md` | State machine, data flow, key functions                                                          |
| `.claude/docs/adding-games.md`      | How a game gets into the game, database and blob store included                                  |
| `.claude/docs/schema-migrations.md` | The migration runbook: generate, review, staging, production, expand/contract, stamping          |
| `.claude/rules/`                    | Coding conventions, quality gates, framework rules                                               |

## Triggers

Update the documentation in the same commit whenever the change involves:

- a new or renamed npm script, API route, database table or column, or environment variable
- a new migration in `drizzle/`, or any change to how one is generated or applied
- a new dependency that changes how something is built, stored or deployed
- a moved, added or deleted file that the structure docs list
- a changed data flow — where data is read from, where images are served from, what the fallback is
- a completed sprint task or user story (tick the box in `SPRINTS.md`)
- an operational fact the next session cannot rediscover from the code: a store ID, a region,
  a destructive command, a manual step only the user can perform

## Facts that live nowhere else

Infrastructure details are invisible to anyone reading the source. When a session learns one —
a provider setting that cannot be changed after creation, a command that wipes a table, a step
blocked for Claude — write it into `SPRINTS.md` under the sprint that needs it, or into
`CLAUDE.md` if it applies generally. Do not leave it in the conversation.

## Enforcement

`.claude/hooks/docs-sync-guard.sh` runs before `git commit`. If `src/`, `scripts/`,
`package.json`, `svelte.config.js`, `vite.config.ts`, `drizzle.config.ts` or `.env.example`
are staged and no document is, the first attempt is blocked with a checklist. Repeating the
same commit lets it through — the guard is a prompt to check, not a veto.
