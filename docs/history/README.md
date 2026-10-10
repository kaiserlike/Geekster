# History

What was built, decided and verified, one file per number. These files are a record, not
instructions: `CLAUDE.md` and the rest of `docs/` describe the project as it is now, and `PLAN.md`
holds the current and next milestones.

## Naming

- **Numbers 1–10 were called _sprints_; from 11 on they are _milestones_.** Same thing: a numbered
  theme, released when it is done, not a time box. The archived files keep their original
  headings ("Sprint 7 — …") because commits and decisions refer to them that way
- **A letter suffix is a _work package_** (`10c`, `11a`). The old files call these "slices" or
  "tasks"; `7f`–`7i` were sub-sprints of Sprint 7
- **IDs are never reused or renumbered once work has started.** The one renumbering happened
  before any work: Sprint 8m (planned, never started) became **Milestone 11**, so the
  encyclopedia moved from 11 to 12 and playing together from 12 to 13 (2026-10-04). A reference
  to "8m" in an archived file means Milestone 11; "Sprint 11" or "Sprint 12" there means
  Milestone 12 or 13
- Decision IDs follow the work package: `10b-2` is the second decision of 10b
- A section reference such as "§ 9g" inside an archived file points into that file or a sibling
- A finished milestone moves here from `PLAN.md` in one commit, word for word, as
  `NN-short-name.md`, and gets a row below

## Index

| #   | File                                                                 | What shipped                                                                                                                                             | Released                                   | Migrations                               |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| 1   | [01-foundation.md](01-foundation.md)                                 | The MVP: core loop, timeline, anchor card                                                                                                                | GitHub Pages era                           | —                                        |
| 2   | [02-game-database.md](02-game-database.md)                           | The game list in `games.json`, polish                                                                                                                    | GitHub Pages era                           | —                                        |
| 3   | [03-lives-streak-drag-and-drop.md](03-lives-streak-drag-and-drop.md) | Lives, streak, drag-and-drop                                                                                                                             | GitHub Pages era                           | —                                        |
| 4   | [04-bonus-points.md](04-bonus-points.md)                             | The year and name bonus, scoring, local leaderboard                                                                                                      | GitHub Pages era                           | —                                        |
| 5   | [05-real-screenshots.md](05-real-screenshots.md)                     | Real screenshots, i18n (EN/DE), GitHub Pages                                                                                                             | GitHub Pages era                           | —                                        |
| 6   | [06-backend-database.md](06-backend-database.md)                     | Vercel, Turso + Drizzle, API routes, screenshots on Vercel Blob                                                                                          | 2026-09                                    | —                                        |
| 7   | [07-admin-panel.md](07-admin-panel.md)                               | Admin panel (7), usability (7f), CI + staging (7g), migrations + tooling (7h), drafts + images (7i)                                                      | PR #19, #21 → #22 (2026-09-20/21)          | `0000` (stamped), `0001`, `0002`         |
| 8   | [08-normal-pro-crop-endless.md](08-normal-pro-crop-endless.md)       | Vitest, endless solo, Normal / Pro slots, crop tool, Pro mode behind the gate                                                                            | PR #27, #28 (09-26), #30, #31 (09-27)      | `0003`                                   |
| 9   | [09-redesign.md](09-redesign.md)                                     | The M3 redesign: tokens, `ui/`, HUD, playing screen, welcome/result, a11y, legal pages                                                                   | PR #32 (2026-09-28)                        | —                                        |
| 10  | [10-daily-leaderboard-sharing.md](10-daily-leaderboard-sharing.md)   | Playtest fixes, slug-free blobs + `dub1`, the referee, global board, Daily Run, sharing, share counts                                                    | PR #33, #34 (10-03), #35, #36 (2026-10-04) | `0004` (10b), `0005` (10d), `0006` (10f) |
| 11  | [11-pipeline.md](11-pipeline.md)                                     | Database tests (11a), HUD clarity (11f), migrations in GitHub Actions + a Vercel Deployment Check (11b, 11c), `develop` sync (11d), Playwright e2e (11e) | PR #37 (10-09), #38 (2026-10-10)           | —                                        |

The file for 10 ends with the playtest feedback of 2026-10-02 that reordered it ahead of 8m.
