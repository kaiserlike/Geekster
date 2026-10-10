# Changelog

One line per production release: date, PR, what shipped, migrations applied before the merge.
The detail is in `docs/history/`; the commits are in `git log`. Newest first.

| Date       | PR        | Milestone  | What shipped                                                                                                                                                                         | Migrations       |
| ---------- | --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 2026-10-10 | #38       | 11b–11e    | The release pipeline: staging and production migrate in GitHub Actions, Vercel waits for the production migration, `develop` follows `main`; Playwright smoke tests on PRs to `main` | —                |
| 2026-10-09 | #37       | 11a, 11f   | The HUD from player feedback: Daily progress squares, endless multiplier ladder and charging heart; database integration tests                                                       | —                |
| 2026-10-04 | #36       | 10c–10f    | Names and the global board, the Daily Run, sharing (text + canvas card), anonymous share counts                                                                                      | `0005`, `0006`   |
| 2026-10-04 | #35       | 10b        | The server is the referee: `runs`, the four calls, `/api/games` admin-only                                                                                                           | `0004`           |
| 2026-10-03 | #34       | 10a        | Slug-free blob names (production's 299 renamed), functions in `dub1`                                                                                                                 | —                |
| 2026-10-03 | #33       | playtest   | Decade leak and drag flicker fixed, decade labels removed from the playing timeline                                                                                                  | —                |
| 2026-09-28 | #32       | 9b–9g      | The redesign: tokens, `ui/`, HUD, playing screen, welcome/result, a11y pass, legal pages                                                                                             | —                |
| 2026-09-27 | #31       | 8, slice 4 | Mode choice, Pro scoring, leaderboards per mode, the `PRO_MIN_POOL` gate                                                                                                             | —                |
| 2026-09-27 | #30       | 8, slice 3 | The crop tool in both pickers, re-crop, add a shot straight from its crop                                                                                                            | —                |
| 2026-09-26 | #28       | 8, slice 2 | Normal / Pro slots, primary per tier, `?difficulty=`                                                                                                                                 | `0003`           |
| 2026-09-26 | #27       | 8, slice 1 | Vitest, endless solo, life regain, perfect run, new result screen                                                                                                                    | —                |
| 2026-09-21 | #21 → #22 | 7i-e       | The RAWG picker on the create form                                                                                                                                                   | —                |
| 2026-09-20 | #19       | 7h, 7i-a–c | Migration tooling, draft mode, one image pipeline, RAWG preview                                                                                                                      | `0001`, `0002`   |
| 2026-09-19 | —         | 6, 7       | Live at geekster.pro on Vercel + Turso; the admin panel                                                                                                                              | `0000` (stamped) |
