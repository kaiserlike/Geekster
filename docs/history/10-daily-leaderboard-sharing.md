<!-- Archived verbatim from SPRINTS.md on 2026-10-04. It describes the project as it was then;
     CLAUDE.md and docs/ describe the present. See docs/history/README.md for the naming. -->

## Sprint 10 - Daily Timeline, Global Leaderboard & Sharing

> Goal: a reason to come back every day, and a reason to tell someone. And first: a score on the
> global board means the player earned it

Moved ahead of Sprint 8m on 2026-10-02, after the first playtest (§ Playtest feedback, 2026-10-02).
**Planned in advance on 2026-10-02**: what can be decided without code is decided here, and what
is better decided while building, or by the user at the sprint's start, is listed under "Open"
with a recommendation, not settled.

### Start here (for the implementation session)

0. **Sprint 10 is complete and released** (PR #36, 2026-10-04). Next: Sprint 8m.
   **Update (2026-10-04, later):** 10c, 10d and 10e are verified on staging; **10f is verified on
   staging too** (§ 10f, migration `0006`). Next: the one Sprint 10 release
   (`0005` and `0006` on production before the merge)
   **Earlier (2026-10-04):** PR #33 (playtest fixes), PR #34 (**10a**) and PR #35
   (**10b**, the referee) are released. **10c is built on `develop`** (its decisions are in
   § 10c under Tech Tasks); what is left of it is staging and the release (no migration). Then
   **10d**: ask 10d-1, 10d-2, 10d-3. The scores table starts clean: every row on it was written
   by the server. The audit below is from before 10a and 10b; the items they closed are
   marked
1. Read this section to the end, then § Playtest feedback, 2026-10-02, then `CLAUDE.md` § Game
   Logic and § Schema Migrations, then `.claude/docs/schema-migrations.md`. **Sprint 8m comes
   after this sprint**, so 10's migrations are applied by hand through the runbook, as before
2. **Ask the "Open" questions of the slice you start, not all of them at once.** The table under
   "Delivery order" says which slice asks which
3. **Changed 2026-10-04 (user): nothing more goes to `main` until Sprint 10 is complete.**
   10c onwards wait on `develop` and staging and ship in one release, as Sprint 9 did; a
   production fix meanwhile goes `hotfix/*` off `main`. Before that: each slice went to `develop` and staging, and was **released on its own** (the normal flow in
   `CLAUDE.md` § Deployment & CI; Sprint 9's one-release rule ended with Sprint 9). 10a and 10b
   together close the cheat, so release 10b soon after 10a
4. The pure rules the server needs already exist and are tested: `placement.ts`
   (`isPlacementCorrect`, `findCorrectIndex`, `applyPlacement`, `runOutcome`) and `scoring.ts`
   (`calculateRoundScore` per mode). **The server imports them; it never gets a copy.** A rule
   that has to change changes there, with its test
5. The CDP drivers in `scratchpad/cdp/` (gitignored, this laptop; repaired for the current UI on
   2026-10-02, README there) read every year from `/api/games` to play a run. After
   10b that endpoint is still there for the admin tooling and the drivers, but a run no longer
   hands out years, so check whether `/api/games` itself should stay public (open question 10b-3)

### Where Sprint 10 starts (audited 2026-10-02)

- ~~**The client gets the answers.**~~ **Fixed by 10b** (the referee). Before it: `startGame()` (`src/lib/game.svelte.ts`) fetches
  `/api/games/random?count=1000`: the whole live pool, shuffled, with `name` and `year`, in the
  order the run will play it. `placeGame()`, `submitBonusGuess()` and `advanceToNextGame()` then
  decide everything on the client. **These three functions are the seams**: each becomes a call
  to the server, and `GameState` keeps its shape, so the components barely change
- ~~**The image URL names the game.**~~ **Fixed by 10a:** every blob is
  `screenshots/<32 hex>.webp`, production's 299 renamed. What remains is 10b's: the client still
  receives `name` and `year` with every card
- ~~**The global board takes any score.**~~ **Fixed by 10b**: the server writes `scores` at the
  end of a run, and there is no POST any more. Before it: `POST /api/scores` stores the `totalScore` a client
  sends, with `playerName: 'Anonymous'` hard-coded in `ResultScreen.svelte`. The production rows
  written since Sprint 9's release are therefore unverified
- ~~**The bonus timer is the client's.**~~ **Fixed by 10b** (`bonus_deadline`). Before it:
  `BonusGuessPanel.svelte` counts `TIME_LIMIT = 30` with a
  `setInterval`; nothing on the server knows when a bonus round started
- ~~**Functions run in `iad1`.**~~ **Fixed by 10a:** functions run in `dub1`, next to the
  database (`aws-eu-west-1`); the blob store is in `fra1` behind its CDN. A one-query API call
  from Austria: median 78 ms on production (was 219 ms)
- **The `scores` table:** `id`, `player_name` (not null), `total_score`, `correct_placements`,
  `wrong_placements`, `best_streak`, `difficulty` (default `normal`), `created_at`. No link to a
  run, no device
- **`localStorage` today:** `geekster-locale`, `geekster-mode`, `geekster-leaderboard-normal`,
  `geekster-leaderboard-pro`, the read-only `geekster-leaderboard` and `geekster-coach-seen`. The
  privacy page lists them (`STORAGE_KEYS` in `src/routes/privacy/+page.svelte`) and says there
  are no cookies for players and no analytics. **A device id, a stored name or analytics change
  that page in the same commit**

### Decisions made before the sprint (2026-10-02)

| #   | Question                                      | Decision                                                                                                                                                                                               |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Sprint 10 or 8m first?                        | **Sprint 10.** The playtest showed the answers in the network panel and an open board; that matters more than automating a manual step that works                                                      |
| 2   | Replay a move log, or referee each placement? | **Referee each placement.** A replay stops a fabricated score but leaves every year in the client, and the Daily's answers with it                                                                     |
| 3   | Hide the data in the meantime?                | **No.** Obfuscation stops a glance, not a cheater, and the image URL names the game anyway                                                                                                             |
| 4   | What can be shared?                           | **The Daily and the end screen of an endless run** (US-10.2)                                                                                                                                           |
| 5   | Daily rules (from the Sprint 8 plan)          | The same 10 games for everyone, 3 lives, the Normal pool, one attempt per device, numbered #1, #2, …                                                                                                   |
| 6   | Identity                                      | A random device id in `localStorage` plus a display name. **No accounts** in this sprint. Clearing storage loses the device's history and its "one attempt", and that's accepted                       |
| 7   | What a referee cannot stop                    | Recognising a picture, or looking one up by reverse image search. Not attempted. The board measures knowing games, and a reverse image search inside 30 s is a cost the cheat has to pay on every card |

### Architecture

**The run protocol** (shapes are a sketch, final names at implementation):

| Request                                           | The server …                                                                                           | Answers                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `POST /api/runs {mode, deviceId}`                 | checks the Pro gate, shuffles the live pool, stores the order, reveals the anchor                      | `runId`, the anchor (image, name, year), the first card (**image only**)           |
| `POST /api/runs/:id/place {slot}`                 | checks the slot with `isPlacementCorrect`, applies `applyPlacement`, opens the bonus window if correct | verdict, the card's index in the timeline, lives, streak; **no name, no year yet** |
| `POST /api/runs/:id/bonus {year, name}` (or skip) | scores it with `calculateRoundScore` if it arrived inside the window, else as skipped                  | the card's name and year, the round's breakdown, the new total                     |
| `POST /api/runs/:id/next`                         | ends the run (`runOutcome`) or hands out the next card                                                 | the next card (image only), or the result; at the end it writes `scores`           |

- A **miss** reveals the card at once (the client must show where it belongs), so `place`
  answers with name and year when the verdict is wrong, and there is no bonus window
- **The run's state lives in a `runs` row**; a serverless function has no memory between
  requests. A sketch: `id` (random, unguessable, it is the run's only credential), `mode`
  (`normal | pro | daily`), `daily_date`, `device_id`, `game_ids` (the order, JSON), `position`,
  `lives`, `streak`, `best_streak`, `lives_won_back`, `total_score`, `correct`, `wrong`, `stage`
  (`placing | bonus | over`), `bonus_deadline`, `created_at`, `finished_at`. The timeline is
  derived from `game_ids` and `position`, not stored
- **Every write is conditional** on the stage and position it expects
  (`UPDATE … WHERE id = ? AND position = ? AND stage = ?`): a double tap, a retried request or two
  tabs on one run cannot place a card twice or score a bonus twice
- **The bonus window is the server's:** `bonus_deadline` = the verdict's time + 30 s + a slack for
  the round trip. The client's countdown stays (it is the display); the server is the judge
- **The client stops scoring.** It renders what the server answers. `game.svelte.ts` keeps
  `GameState` and becomes the client of the four calls; `calculateRoundScore` is no longer called
  in the browser
- **`scores` is written by the server, once, at the end of a run** (`run_id` unique). `POST
/api/scores` and the whole-pool `/api/games/random` are retired in the same release. A tab
  loaded before the release fails its next start and shows the existing "games unavailable"
  error with its retry; a reload fixes it. No compatibility layer
- **Images without the slug** (10a): see open question 10a-1
- **The daily set is a snapshot**: `daily_challenges` (`date` primary key, `game_ids`,
  `created_at`), written by the first request of the day with an insert that ignores a conflict,
  so two first requests agree. Publishing a game mid-day does not change today's puzzle. The
  number is the days since the first Daily
- **One attempt per device** is `UNIQUE (device_id, daily_date)` on `runs` for daily runs. It is a
  soft rule: a cleared storage plays again, and so does a second browser (decision 6)
- **Migrations:** `runs` and `daily_challenges` are new tables; `scores` gains `run_id` and
  `device_id` (nullable: the old rows have neither). Expand-only, so each is safe before the code
  that uses it

### Open: decided at a slice's start, not now

| #     | Question                                                           | Recommendation, and why it waits                                                                                                                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10a-1 | Slug-free images: re-upload under random names, or a proxy?        | **Re-upload.** A script in the style of `blob:migrate` copies each blob to `screenshots/<random>.webp`, rewrites `screenshots.url`, and deletes the old file through the stage guard; `uploadScreenshot()` drops the slug. A proxy costs a function call per image and loses the blob CDN's cache. Decide after checking the blob store's operation limits on Hobby |
| 10a-2 | Region: `dub1` (next to Turso) or `fra1` (next to the blob store)? | **`dub1`**, because the database round trips are the ones repeated per request; images come from the blob CDN anyway. **Measure first** (a placement round trip on staging before and after), and confirm that Hobby lets the project pick its region. Both stages share one project, so this moves staging and production together                                 |
| 10b-1 | What happens to production's unverified `scores` rows?             | Dump, then delete them, as at Sprint 8's slice-1 release, so the first verified board starts clean (production had **19** `scores` rows in the 10a dump of 2026-10-03). The user's call at release                                                                                                                                                                  |
| 10b-2 | A pending state on the card while the verdict travels              | **Measured in 10a:** a one-query call takes a median 78 ms on production, 97 ms on staging (p90 ≤ 150). Below ~150 ms, none — but a `place` call does more than one query, so measure it once built                                                                                                                                                                 |
| 10b-3 | Does `/api/games` (the full live list with years) stay public?     | Nothing in the game reads it after 10b; the drivers and maybe the encyclopedia do. Probably admin-only, or names without screenshots. Decide when 10b is built                                                                                                                                                                                                      |
| 10c-1 | When is the name asked for?                                        | After the first finished run, on the result screen, once; changeable later. Stored as `geekster-player-name`. The user decides the flow                                                                                                                                                                                                                             |
| 10c-2 | Name filtering                                                     | A short block list plus length and character rules, and the admin's delete. Which list (DE + EN) is chosen while building                                                                                                                                                                                                                                           |
| 10c-3 | Is the board's name a snapshot or the device's current name?       | Snapshot per score row: renaming doesn't rewrite history, and a deleted row stays deleted                                                                                                                                                                                                                                                                           |
| 10d-1 | The Daily's day boundary: UTC or the player's midnight?            | **Open, the user's call.** UTC gives everyone the same #N at the same moment (simple, one board per day); local midnight matches Wordle's habit but means two puzzles are live at once around the world                                                                                                                                                             |
| 10d-2 | How the Daily picks its 10                                         | Random from the Normal pool, spread over the decades so it isn't ten 2010s games, never repeating a recent Daily's games. Or curated in the admin panel. The user's call; random first, curation later is the cheap path                                                                                                                                            |
| 10d-3 | Where the Daily lives on the welcome screen                        | A design question for the slice, against the M3 boards                                                                                                                                                                                                                                                                                                              |
| 10e-1 | The share text's exact form                                        | A sketch: `Geekster Daily #12 · 🟩🟩🟥🟩🟩🟩🟥🟩🟩🟩 · 1,240 CR · geekster.pro` and `Geekster · Endless Normal · 3,450 CR · streak 17 · geekster.pro`. The emoji row's meaning (bonus hits too?) is decided while building it                                                                                                                                       |
| 10e-2 | A rendered image per result (`@vercel/og` / satori)                | Optional; text first. Sprint 9 designed the share-card template for it                                                                                                                                                                                                                                                                                              |
| 10f-1 | Analytics: Vercel Web Analytics, something else, or none yet       | Check the Hobby limits first; whatever it is must be cookieless, and the privacy page changes with it                                                                                                                                                                                                                                                               |

### Delivery order

One session per slice. Each ends verified on staging and is released on its own.

| Slice   | Content                                                                                                                                                      | Migration                                    | Stories          | Ask at its start    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ---------------- | ------------------- |
| **10a** | Images without the slug (script + upload change); the function region, measured before and after                                                             | none                                         | —                | 10a-1, 10a-2        |
| **10b** | The referee: `runs`, the four calls, `game.svelte.ts` as their client, server-side bonus window, `scores` written by the server; old endpoints retired       | `0004`: `runs`; `scores.run_id`, `device_id` | (US-10.3's base) | 10b-1, 10b-2, 10b-3 |
| **10c** | Names and the global board: device id, name entry, `/leaderboard` (mode, all-time / this week, pagination), admin delete, rank and personal best after a run | none expected                                | US-10.3, US-10.4 | 10c-1, 10c-2, 10c-3 |
| **10d** | The Daily Timeline: `daily_challenges`, the daily run, the welcome entry, one attempt per device, today's board, the daily streak                            | `0005`: `daily_challenges`; `runs` unique    | US-10.1, US-10.5 | 10d-1, 10d-2, 10d-3 |
| **10e** | Share: the Daily and the endless end screen; Web Share API on a phone, the clipboard elsewhere                                                               | none                                         | US-10.2          | 10e-1, 10e-2        |
| **10f** | Analytics events (run started / finished, share clicked), if 10f-1 says yes                                                                                  | none                                         | —                | 10f-1               |

10a comes first because it is independent of the protocol and small, and the referee is pointless
while the image names the game. 10b is the sprint's real work; if it runs long, split the bonus
window off into its own session.

### User Stories

- [x] US-10.1 (10d): As a player, there is one **Daily Timeline** a day: the same 10 games for
      everyone, one attempt, numbered (#1, #2, …)
- [x] US-10.2 (10e): As a player, I can share my daily result without spoilers (an emoji row of hits and
      misses, my score, a link) — **and the end screen of an endless run** (mode, score, best
      streak, a link), with the same share button (playtest, 2026-10-02)
- [x] US-10.3 (10c + 10d): As a player, I see a global leaderboard: Endless Normal, Endless Pro, today's
      Daily. All-time and this week. **Every score on it was refereed by the server**
- [x] US-10.4 (10c): As a player, I enter a display name once and see my rank and personal best
      after a run
- [x] US-10.5 (10d): As a player, I keep a daily streak (days in a row played)
- [x] US-10.6 (10a + 10b): As a player, I cannot read the answers from the network panel: a card arrives as
      an image whose URL doesn't name the game, and its name and year come only after I have
      placed it (playtest, 2026-10-02)

### Tech Tasks

#### 10a — Images without the slug

**Decided 2026-10-03 (user):** 10a-1 **re-upload**, 10a-2 **`dub1`**. Facts behind it: Hobby has
one function region but lets the project choose it (`adapter({ regions: ['dub1'] })`); a Blob
`copy()` is an _advanced operation_ (Hobby: 2,000 a month included, and **going over locks the
store for 30 days**), `del()` is free. Production had 299 screenshot rows, every one a blob URL
with the slug in its pathname, so the rename costs 299 advanced operations.

- [x] Measure a placement-sized round trip on staging (a trivial API call that runs one query),
      then set the region (10a-2) and measure again; record both here.
      `GET /api/scores?difficulty=normal`, 25 sequential calls from the user's laptop (Austria),
      after two warm-ups (`scratchpad/cdp/rtt.mjs`). **Before, `iad1`** (2026-10-03,
      `x-vercel-id fra1::iad1::…`): staging median 232 ms (min 214, p90 342), production
      median 218 ms (min 205, p90 238). **After, `dub1`** (staging, same day, `fra1::dub1::…`): median 97 ms (min 85, p90 116), a second run 98 ms — **less than half**. So 10b-2 likely needs no pending state (below the ~150 ms line). **Production after the release** (PR #34, `fra1::dub1::…`): median 78 ms (min 68, p90 150), was 219 ms
- [x] `uploadScreenshot()` stores `screenshots/<random>.webp` (32 hex, the stage prefix stays);
      the slug parameter is gone. The admin forms' slug hints say players never see it
- [x] `scripts/rename-screenshot-blobs.js --target=<stage>` (`--dry-run`, `--limit=N`,
      `--no-backup`): per row `copy()` to a random name, `UPDATE … WHERE id = ? AND url = ?`,
      then `del()` of the old file; a stage renames only the blobs it owns (the `ownsBlob()`
      rule), and it dumps the database first. Tried on staging's own two `staging/` rows
      (2026-10-03): renamed, the old files gone from `list()`, the new ones served as
      `image/webp`. **Production: done 2026-10-04** (user's go): `--limit=3` first (served, and
      `/api/games` returned the new URLs), then the other 296; dump
      `backups/production-2026-10-03T22-07-13-564Z.json` (the last one with the old names), then
      `db:refresh-staging`. Checked: 299 of 299 production rows random and answering 200, staging
      the same 299, and `list({ prefix: 'screenshots/' })` holds 299 files, none with an old
      name; a card played on geekster.pro. 301 advanced operations in all
- [x] Seed data: `blob:migrate` writes random names too (decided while building: a fresh
      environment should not bring the slug back; `--force` now leaves the old files
      unreferenced instead of overwriting them)
- [x] Docs: the blob naming in `CLAUDE.md` § Environments, § Admin Panel and § Tech Stack (the
      region), `.claude/docs/` (adding-games, game-architecture, project-structure)
- **Backups from before the rename point at deleted files.** A `db:dump` older than the
  production run restores rows whose `screenshots.url` no longer exists; the run's own dump is
  the last one with the old names

#### 10b — The referee

**Decided 2026-10-04 (user):** 10b-1 **dump, then delete** production's unverified `scores`
rows at release; 10b-2 **lock at once, show it only past 300 ms**; 10b-3 **`/api/games` becomes
admin-only** (`/api/admin/games`). Found while building: `/api/games` returned each live game's
screenshot URL _with_ its name and year, so as long as it was public the referee protected
nothing — a card's image URL looked the answer up.

- [x] Migration `0004_runs` (runbook): `runs`; `scores.run_id` (unique index
      `scores_run_id_unique`) and `scores.device_id`, both nullable. Generated, read (an
      `ADD COLUMN` + `CREATE UNIQUE INDEX`, nothing rebuilt), renamed; from scratch
      (`migrate` + `seed` on an empty file) and on `local.db`; a second run applies nothing
- [x] `src/lib/server/runs.ts`: `createRun`, `placeCard`, `submitBonus`, `nextCard`, each a
      conditional `UPDATE … WHERE id AND stage AND position … RETURNING`. The end of a run is
      one `db.batch`: the run's update and `INSERT … ON CONFLICT (run_id) DO NOTHING`
- [x] `src/lib/server/runRules.ts`, pure, 22 tests in `runRules.test.ts`: `place`, `scoreBonus`,
      `advance`, `parseGuess`; a double place / bonus, a stale position, a slot out of range, a
      bonus after a miss or past the deadline
- [x] `game.svelte.ts` as the client of the four calls; `GameState` keeps its shape except
      `currentGame` (a `RunCard`: id = position, screenshot), `remaining` (a number), `pending`
      and `runError`. Each action runs the screen's follow-up in the same tick as its state
      change (`placeGame(slot, onPlaced)` …), or a frame would render in between
- [x] The bonus window on the server: verdict + 30 s + 5 s (`BONUS_SLACK_MS`); late = skipped,
      the placement's 100 still counts. The panel's countdown is the display
- [x] Retired: `POST /api/scores`, `GET /api/games/random`; `GET /api/games` →
      `GET /api/admin/games`. `GET /api/scores` lists the board's columns explicitly (no
      `run_id` / `device_id`)
- [x] Verified locally (2026-10-04): a protocol script (`scratchpad/proto.mjs`) — 22 checks:
      the first card and every next card without name or year; a hit's answer only from
      `bonus`; double place, second bonus, `next` during the bonus, a bonus after a miss and a
      `next` after the end refused (409); a forced-late bonus scored as skipped; one `scores` row
      equal to the run's total. Races (`race.mjs`): 8 parallel duplicates of `place`, `bonus`
      and the final `next` → one 200 and seven 409 each, one `scores` row. The CDP run driver
      (`run.mjs`, now reading answers from `/api/admin/games` with an admin login) played
      `RRWRRWW` to the end: **no card's name reached the page before its placement** (all 19
      `/api/` responses read), the hidden `????` row, the reveal, the miss's ghost and the
      result as before, the score row refereed. 600 ms latency: "CHECKING…" on the card;
      offline: the retry line, and the same "Next card" goes through once online again
- [x] Privacy page: the "Global leaderboard" section becomes "Runs and the global
      leaderboard" (every move goes to the server, which keeps the run's state under a random
      run id; guesses are scored, not stored); `LEGAL_UPDATED` 2026-10-04
- [x] Docs: API routes in `README.md` and `CLAUDE.md`, § The referee in
      `.claude/docs/game-architecture.md`, the structure docs, the migration table
- [x] Staging (2026-10-04): `db:dump -- --target=staging`, `db:migrate:staging` before the push
      (5 migrations recorded, `runs` and `scores_run_id_unique` there; a second run applies
      nothing), then `28d463f` deployed. `/api/games` and `/api/games/random` 404,
      `/api/admin/games` 401, `POST /api/scores` 405. `run.mjs` (answers from the staging DB:
      staging has no `ADMIN_PASSWORD`) played `RRRWRWW` to game over on the blob images: no card
      name before its placement, the result screen right, the server's `scores` row 430 / 4 / 3
      with its `run_id`. **10b-2 measured** (`placertt.mjs`, from Austria, `fra1::dub1`): `place`
      median 118 ms (min 106, p90 130), `bonus` 115, `next` 121, `start` 117 — a few queries
      cost ~20 ms over 10a's one-query 97 ms, well below the 300 ms where "Checking…" appears
- [x] **Release** (PR #35, merged 2026-10-04, `7412b79`):
  1. `npm run db:dump -- --target=production` — **done 2026-10-04**,
     `backups/production-2026-10-03T22-41-51-979Z.json` (19 `scores` rows, none refereed)
  2. `npm run db:migrate:production` **before the merge** — **done 2026-10-04**: 5 migrations
     recorded, `runs` and `scores_run_id_unique` there, a second run applied nothing, the old
     code still served `/api/games/random` 200 (expand-only, safe under the old
     code; the new code needs `runs`, so never the other way round)
  3. Merge — **done**, `develop` synced; geekster.pro served the new code ~10 s after the
     build. The deploy retires the old endpoints. A tab loaded before it fails its next move
     (404) and shows "This run cannot go on" with Menu — a reload fixes it
  4. 10b-1: delete production's unverified `scores` rows (`run_id IS NULL`), the dump of step 1
     being their record — **done**: 19 deleted, 0 left
  5. Check on geekster.pro: a run plays, `/api/games` is 404 and `/api/admin/games` 401, the
     finished run's row is on the Global tab — **done**: `/api/games` and `/api/games/random`
     404, `/api/admin/games` 401, `POST /api/scores` 405, a Pro start 409 (gated), `fra1::dub1`.
     `run.mjs` played `RRWRWW` to game over: no card name before its placement, and the
     server's row (id 22, 310 CR, 3 / 3) was on the Global tab. That test row was deleted
     afterwards (user's call), so production's board starts empty
- Runs are never cleaned up: an abandoned run stays in `placing` or `bonus`. A few hundred bytes
  each; revisit if the table grows into the tens of thousands

#### 10c — Names and the global board

**Decided 2026-10-04 (user), each the recommendation:** 10c-1 **after the first run**, on the
result screen, once; 10c-2 **rules + block list**, and the admin's delete; 10c-3 **a snapshot
per score**. And a fourth, asked at the start: **the board shows each device's best** per mode,
not every run, so one keen player can't fill the first page. Decided while building: "this
week" = since **Monday 00:00 UTC** (one week for everyone, as the Daily will have one day); a
page is 20 rows, at most 50 pages; the question counts as asked the moment it shows (ignoring it
and playing again doesn't repeat it); a score is named through its run id, only while it is
"Anonymous"; the name rides on every `next` and counts on the last. **No migration**:
`scores.device_id` and `runs.device_id` came with `0004`.

- [x] Device id (`geekster-device-id`) and name (`geekster-player-name`) in
      `src/lib/player.svelte.ts`; `POST /api/runs` takes `deviceId` (malformed → null), the run
      and its score keep it. Privacy page: both keys, a new paragraph on the device id and the
      public name (legal basis Art. 6(1)(b), deletion on request), "only these two leave the
      browser"
- [x] Name entry (10c-1): `PlayerNameForm.svelte` on the result screen after the actions;
      `POST /api/runs/:id/name` (400 + `problem`, 404, 409 once named). Filtering (10c-2):
      `checkName()` in `src/lib/playerName.ts`, 10 tests — rules, a long-term list matched
      anywhere and a short-word list matched as whole words after folding case, accents and
      leetspeak (`H1tl3r` refused, `Assassin`, `Ignazio`, `Bastian` pass), reserved names as the
      whole name only (`Geekster` refused, `Geekster Fan` passes)
- [x] `/leaderboard`: Normal / Pro, all-time / this week, 20 a page with Previous / Next, the
      player count, the device's rows marked "You", and its own row with a link to its page
      when it is on another (`me` in the API). The name for later runs is changed there. The board on the welcome and result screens links to it from every tab; its Global tab shows names and marks "You".
      `GET /api/scores` answers `{ rows, players, page, pages, me }` now (was an array)
- [x] Rank and personal best on the result screen: the last `next` answers `standing`
      (`standingOf()`): "#19 of 38 worldwide", with "New personal best" or "Your best: N CR";
      without it, the local rank as before
- [x] Admin: `/admin/scores` (sidebar "Scores", and "All scores →" on the dashboard): every row
      newest first, mode filter, name search (LIKE wildcards literal), delete through the confirm
      dialog; a row from before the referee is flagged "unrefereed"
- [x] Verified locally (2026-10-04): a protocol script (session scratchpad, `proto10c.mjs`) —
      26 checks: name and device on the score, normalised; the standing over three runs of one
      device (first, better, worse); one board row per device, its best, `mine`, its rank equal
      to the standing; no `run_id` / `device_id` in a row; a refused name via `next` →
      Anonymous, a bad device id → null; naming 400 / 200 / 409 / 404; this week vs. all-time; a
      page past the end clamped. In headless Brave (`run.mjs` with `AFTER=./after10c.mjs`):
      the result screen's "#19 of 38 worldwide", the name card, `H1tl3r` refused, a name saved
      onto the score, the Global tab and its link, `/leaderboard` paging, This week, "Your row,
      page 2", and a rename that left the stored score alone. Admin delete by curl (200, then
      404 for the same id; signed out → login)
- [x] Docs: `CLAUDE.md` (structure, § Game Logic, § Admin Panel), `README.md` API routes,
      `.claude/docs/game-architecture.md` § The global board, `project-structure.md`
- [x] Staging (2026-10-04): `81865eb` pushed, CI green, deployed and aliased to
      staging.geekster.pro (no migration). `run.mjs` (`ANSWERS=staging`, `AFTER=./after10c.mjs`)
      played `RRWWW`: no card name before its placement, "#7 of 11 worldwide", the name card,
      `H1tl3r` refused, "Pixel Tester" saved, the Global tab's "You" row, `/leaderboard` (11
      players, all-time and this week), the rename on the page. The staging row (id 15) has the
      name and the device id, and so does its run; the rename left it alone. `/admin/scores` was
      checked locally only (Preview has no `ADMIN_PASSWORD`)
- [ ] Release: PR `develop` → `main`; no migration. A tab loaded before it keeps working (its
      `next` carries no name, so its score is Anonymous; its Global tab reads the old array
      shape as an error and shows "unavailable" until a reload)

#### 10d — The Daily Timeline

**Decided 2026-10-04 (user):** **one attempt per device**, enforced by the server; a private
window or cleared storage can play again (a new device id), accepted as a known limit like
decision 7 until accounts exist. Considered and declined: also one ranked Daily per network (a
daily-salted IP hash), because shared Wi-Fi and carrier NAT would block each other and it would
store IP-derived data. 10d-1 **midnight UTC**. 10d-2 **random from the Normal pool, spread over
the decades, no game from the last 30 Dailies**, written once by the day's first request.
10d-3: two options sketched on the design canvas (page "10d · Daily on the welcome screen":
A, a Daily card above Endless; B, Daily as a third mode), the user picks.

10d-3, decided 2026-10-04 (user) after three rounds on the canvas (page "10d · Daily on the
welcome screen"): **design A** — a pink "Daily Run #N" card above a turquoise "Endless Run" card,
the intro and "How to play" kept, the done state calm (the score on its own line, the squares,
"Place N of M players today", today's board, the countdown), the streak as 🔥 N. Decided while
building: the set is **11 games** (anchor + 10 cards); a reload **resumes** an unfinished Daily
Run (an open bonus counts as skipped) instead of losing it; the Daily's score is on its own
board (`difficulty = 'daily'`), not Normal's, and off the local endless lists; the Share button
of the sketch comes with 10e.

- [x] Migration `0005_daily` (runbook): `daily_challenges`; `runs.daily_date`, `runs.marks`,
      the partial unique index `runs_device_daily_unique`; `scores.daily_date`. Generated, read
      (expand-only: one `CREATE TABLE`, four `ADD`, one index), renamed; on `local.db` (a second
      run applies nothing)
- [x] The day's set, written once (10d-1, 10d-2): `pickDaily()` / `dailyStreak()` / the day in
      `src/lib/daily.ts` (13 tests), `todaysDaily()` in `src/lib/server/daily.ts`
- [x] A Daily Run: `POST /api/runs {mode: 'daily'}`, 10 cards, 3 lives, the Normal pool; resume;
      `runs.marks` (`place()` appends, tested); the result screen's Daily variant; today's board
      (`/leaderboard?mode=daily`, `GET /api/scores?difficulty=daily`); `DAILY #N` in the header
- [x] One attempt per device (409 once played, a parallel second start resumes the same run);
      the daily streak (`GET /api/daily`). **Not built: a Daily personal best** — the welcome
      card was made calmer on purpose; the board and the streak carry it for now
- [x] The welcome screen as design A (`DailyCard`, `DailyMarks`, the Endless Run card); a `pink`
      Button and an `accent` Surface frame, both on `/styleguide`; `/admin/scores` filters Daily
- [x] Verified locally (2026-10-04): `proto10d.mjs` (session scratchpad), 19 checks — the set
      once and shared, 400 without a device, resume at card 1, during a bonus and after a
      revealed miss, the end after 10 cards with `marks` and a `today` standing, the score on the
      Daily board and not Normal's, 409 for a second attempt, the status (score, marks, rank,
      streak 1, then 2 with yesterday), parallel starts → one run. In headless Brave: a whole
      Daily Run (`DAILY=1 run.mjs … RRRWRRRRRR`, no answer before its placement), the result,
      the done card, today's board; `resume10d.mjs`: a reload → "Continue today's Daily" at card
      3 with the score kept; a lost Daily (`WWW`). axe: 0 on the Daily result, the welcome
      screen (done and not played, 320 / 390 / 1280) and today's board
- [x] Docs: `CLAUDE.md` § Game Logic (the Daily Run replaces the 10-placement note), structure,
      migrations; `README.md`; `.claude/docs/` (game-architecture § The Daily Run, project
      structure, the runbook's table); privacy page (the device id holds the one try, the
      streak and the resume)
- [x] Staging (2026-10-04): `db:dump -- --target=staging`
      (`backups/staging-2026-10-04T10-15-30-043Z.json`), `db:migrate:staging` before the push (6
      migrations, `daily_challenges` and `runs_device_daily_unique` there, a second run applied
      nothing), then `32fd6cc` pushed, CI green, deployed. A Daily Run on staging.geekster.pro
      (`DAILY=1 ANSWERS=staging run.mjs … RRRWRRRRRR`): Daily Run #1, no answer before its
      placement, "Daily Run complete!", `oooxoooooo`, Today's board / Menu, the done card with 🔥 1
      and the countdown, today's board with the row marked "You". Found there: "1 of 1 players" →
      singular, fixed (`0d7962c`)
- [ ] Production, at Sprint 10's one release: `db:dump` + `db:migrate:production` **before** the
      merge (the new code needs `daily_challenges`; expand-only, so the old code is safe on it)

#### 10e — Share

**Decided 2026-10-04 (user):** 10e-1 — the Daily's row is **hit / miss only** (🟩 / 🟥, what
`runs.marks` stores; a Daily lost early is padded to its ten cards with ⬛); the endless text is
**mode, score, best streak, the global rank when there is one, the link**; both in the player's
language. 10e-2 — **text and a rendered image**. The Share button goes on the **result screen**
(Daily and endless) and on the **welcome screen's done Daily card** (design A's share icon).
Decided while building: the image is drawn **in the browser on a canvas**, not by `@vercel/og`
on the server — no function call per share, no new dependency, the fonts the page already
loaded, and nothing to fetch by URL (a public per-result URL would have needed its own id; the
run id is the run's credential). The cost: a shared link's preview stays the static OG image.
The link is always `https://geekster.pro`, whichever stage the run was played on.

- [x] The share text (10e-1): `shareText()` in `src/lib/share.ts`, 11 tests with
      `share.test.ts` (both languages, a lost Daily padded, no rank, never a year):
      `Geekster Daily #12 / 🟩🟩🟥… / 1,240 CR · #4 of 37 today / https://geekster.pro` and
      `Geekster · Endless Normal / 3,450 CR · best streak 17 / #19 of 38 worldwide / https://geekster.pro`
- [x] The share card (10e-2): `renderShareCard()` in `src/lib/shareCard.ts`, 1200×630 PNG after
      the canvas board "M3 share card" (Sprint 9a); what it says is the pure
      `shareCardLayout()` (tested): the mode chip, the score, Placed / Misses / Today for a Daily,
      Placed / Best streak / Lives won back / Worldwide for an endless run, the squares (an
      endless run's first 20, then "+ N more"; a Daily's ten, unplayed ones as outlines)
- [x] `ShareButton.svelte`: the card is drawn as the result appears, so a tap shares at once (a
      phone opens its sheet only close to the tap). A coarse pointer with `navigator.share` →
      the share sheet with the text and the PNG (where `canShare({files})`); a closed sheet is
      no error. Otherwise the clipboard, "Copied. Paste it anywhere." and a "Download image"
      link; a failed copy shows the text to copy by hand. No new `localStorage` key, nothing
      sent to the server, so the privacy page is unchanged
- [x] Verified locally (2026-10-04), headless Brave (`after10e.mjs`, `axe10e.mjs` as `AFTER`
      hooks of `run.mjs`): an endless run and a Daily Run — the copied text, the PNG behind
      "Download image" (both looked at), a stubbed `navigator.share` under touch emulation
      receiving the text and `geekster-daily-1.png`, a closed sheet leaving no note; the done
      Daily card in German ("Platz 1 von 1 heute"); axe 0 on the result screen and the welcome
      screen with the note open, no overflow at 320 / 390
- [x] Staging (2026-10-04): `dee36e3` pushed, CI green, deployed to staging.geekster.pro (no
      migration). With `run.mjs` + `after10e.mjs` (`ANSWERS=staging`): a Daily Run
      (`RRRWRRRRRR`) → `Geekster Daily #1 / 🟩🟩🟩🟥🟩🟩🟩🟩🟩🟩 / 1,080 CR · #2 of 3 today`, the
      PNG, the stubbed share sheet given text + `geekster-daily-1.png`; the done Daily card in
      German ("Platz 2 von 3 heute"); an endless run (`RRWWW`) → `#7 of 12 worldwide` and its card
- [ ] A real phone (iOS Safari and Android Chrome: the sheet, the image in a messenger, the text
      pasted) — the user's hand step; headless has no share sheet

#### 10f — Analytics

**Checked first (2026-10-04, Vercel docs):** Web Analytics on **Hobby has page views only**: 50,000
events a month across the account, a 1-month window, collection paused at the limit, and **no
custom events** (Pro only). Geekster is one page for every phase, so page views can't show a run
started, finished or shared. **Decided (user, 10f-1): our own counts, no tracker.** Runs come from
`runs`, which the referee writes anyway; shares get an anonymous counter. Considered and
declined: Vercel page views on top (a third-party processor and a script on every page for
visitor, country and referrer figures), and "none yet" (ROADMAP's share-rate metric would have no
number).

- [x] Migration `0006_share_counts` (runbook): `share_counts (date, kind, method, count)`,
      primary key on the first three. Generated, read (one `CREATE TABLE`, expand-only), renamed;
      on `local.db` (a second run applies nothing)
- [x] `POST /api/share {kind, method}` → 204 (400 for anything else): `parseShareEvent()` in
      `share.ts` (tested), `countShare()` in `src/lib/server/shareCounts.ts` (upsert, `count + 1`
      for the UTC day). `ShareButton` reports `sheet` after the sheet resolves, `copy` after a
      copy, `download` on the image link; fire and forget, `keepalive`; a closed sheet counts
      nothing
- [x] The admin dashboard's "Last 7 days": runs started / finished, Daily players / Dailies
      finished, Daily shares, Endless shares, card downloads, the Daily share rate
      (`shareRate()`, tested) — `getActivity()` in `stats.ts`
- [x] Privacy page (EN/DE): still no analytics; the share count is described, and what it does
      not hold (no device id, IP, run or text)
- [x] Verified locally (2026-10-04): `POST /api/share` 204 / 204 / 400 / 400 by curl; a run in
      headless Brave (`after10e.mjs`, now with the download click): copy, download and the
      stubbed sheet each added one, the closed sheet none; the dashboard's tiles equal to direct
      SQL on `local.db` (15 / 10 / 4 / 2 runs)
- [x] Staging (2026-10-04): `db:dump -- --target=staging`
      (`backups/staging-2026-10-04T14-55-04-791Z.json`), `db:migrate:staging` **before** the
      push (7 migrations, `share_counts` there, a second run applied nothing), then `870daf8`
      pushed, CI green, deployed. An endless run there (`run.mjs` + `after10e.mjs`,
      `ANSWERS=staging`): staging's `share_counts` went from empty to `endless` copy 1,
      download 1, sheet 1. The dashboard was checked locally only (Preview has no
      `ADMIN_PASSWORD`)
- [x] Production at Sprint 10's one release: `0005` and `0006` before the merge — done
      2026-10-04 17:21 UTC, before the release PR was merged: `db:dump -- --target=production`
      (`backups/production-2026-10-04T17-20-49-938Z.json`; the dump script had listed its
      tables by hand and missed `runs` since 10b — `runs`, `daily_challenges` and
      `share_counts` added), `db:migrate:production` (7 migrations, a second run applied
      nothing; new columns, tables and `runs_device_daily_unique` there, `foreign_key_check`
      clean, 298 games / 3 runs / 1 score as before). The live 10b build kept answering 200
- [x] **Released** (PR #36, merged 2026-10-04 17:24 UTC, `293a647`; `develop` fast-forwarded).
      Checked on geekster.pro over CDP: the Daily Run #1 played through (`run.mjs` with
      `DAILY=1`: "Perfect Daily Run!", 10 squares, "Place 1 of 1 player today", the done Daily
      card, today's board), no card's name in any `/api/` response before its placement; an
      Endless run's Share (`after10e.mjs`): copied, the 124 kB PNG, the share sheet with text and
      file; the admin dashboard's "Last 7 days" equal to SQL on production (5 runs started, 4
      finished, 1 Daily, 2 Endless shares, 1 download); `/leaderboard/` 200

### Fixes found while testing Sprint 10

- [x] **The first tap on Reveal didn't reveal on a phone** (user, 2026-10-04): the HUD vanished,
      the bonus panel jumped up, a second tap was needed. `BonusGuessPanel` took any focus inside
      it for "the keyboard is up", and a tap focuses the button before its click (Android), so
      the HUD collapsed and the button moved out from under the finger. Now only a field's focus
      collapses the HUD, and the HUD comes back one task after a field loses focus, so a tap on
      Reveal with the keyboard up isn't pushed down either. Reproduced over CDP at 390 px with
      touch emulation (one tap: still on the bonus round), one tap reveals after the fix; with
      a year typed first too. iOS Safari doesn't focus a tapped button, so an iPhone is to be
      checked by the user on staging

### Definition of done

No answer reaches the client before the card is placed; every score on the global board was
written by the server; the Daily works on a phone and its share text pastes cleanly into a
messenger; the privacy page lists every new key; the migrations are applied on staging and
production through the runbook.

---

## Playtest feedback, 2026-10-02

The user sent the released game to friends. What came back, and where it went:

| Feedback                                                                                         | Finding                                                                                                                                                                                                                                                                                                                                                                                                                           | Where                                    |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| "The network panel shows every game, with name and year, in the order they come"                 | Confirmed, and worse: `/api/games/random?count=1000` ships the whole pool in play order; **the blob pathname carries the slug** (`screenshots/<slug>-<random>.webp`), so even without `name` the image URL names the game; and `POST /api/scores` stores whatever a client sends                                                                                                                                                  | Sprint 10, first task (see Architecture) |
| "There's no way to put my name on the high score board"                                          | Planned (US-10.4). Today `ResultScreen` posts `'Anonymous'`. Not pulled forward: an open name field on an unvalidated board invites abuse                                                                                                                                                                                                                                                                                         | Sprint 10                                |
| "A graphical glitch when I scroll a bit and then drag the card" (not reproduced, no screenshot)  | Found and **fixed**: with the card partly scrolled off, the drag shrank it to the strip, which pushed it off the screen, which brought the pinned bar in, which grew the card back — the two took turns every frame, and the slots jumped under the pointer. The shrink is now decided once at drag start, only with the card's top in view. Reproduced over CDP before the fix (card height 199 ↔ 0 px every ~50 ms), gone after | released, PR #33 (`CurrentCard`)         |
| "1992 looks as if I'm putting it in the 80s" (the slot between 1988 and 1994 sits above "1990s") | A slot at a decade boundary belongs to both decades, but read as the one above the label. The labels added nothing for placing (every row starts with its year). **Removed** from the playing timeline (user decision, to look at on staging; a pink marker on the row was the alternative); the desktop decade ruler stays                                                                                                       | released, PR #33 (`Timeline`)            |
| "Once the slot is right you show extra info: I should only know 2011–2023, but I see 2020s"      | Confirmed **bug**: `decadeBuckets()` counted the hidden card, so during the verdict and the bonus the "2020s" label, the ruler's "20s · 2" and the row's `data-decade` gave its decade away. **Fixed**: until the reveal it counts in its neighbour's decade (`rowDecades()` in `placement.ts`, tested)                                                                                                                           | released, PR #33 (`Timeline`)            |
| "A Daily mode where everyone gets the same, with a score to copy-paste, or share the end screen" | The Daily and its spoiler-free share are planned (US-10.1, US-10.2). **Sharing an endless run's end screen was not** — added to US-10.2                                                                                                                                                                                                                                                                                           | Sprint 10                                |

**Decisions (2026-10-02):** live with the network-panel cheat until Sprint 10 (no obfuscation in
between: it would stop a glance, not a cheater, and the image URL still names the game); Sprint 10
moves ahead of Sprint 8m.
