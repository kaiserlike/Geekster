<!-- Archived verbatim from SPRINTS.md on 2026-10-04. It describes the project as it was then;
     CLAUDE.md and docs/ describe the present. See docs/history/README.md for the naming. -->

> **Sprints 8 onward were re-planned on 2026-09-26.** The vision, the goal for Sprints 8–12, the
> reasons for the order and the encyclopedia's long-term plan are in `ROADMAP.md`. This file keeps
> the stories and tasks. The old plan was Easy / Medium / Hard (Sprint 8), global leaderboard (9)
> and multiplayer (10). It now lives on as Sprints 8, 10 and 12.

## Sprint 8 - Normal / Pro, Crop Tool & Endless Mode

> Goal: two tiers a player understands at a glance, Pro content that is cheap to make, and solo
> runs that last as long as the player is good

### Why

- **Two tiers, not three.** Normal and Pro. Easy / Medium / Hard would need three pools to fill
  and is harder to explain
- **Pro needs different screenshots, not only different numbers.** Making them should cost
  seconds: zoom into a HUD corner, a texture, a character's boots. That needs a crop step in the
  upload pipeline
- **Ten placements is too short for solo play.** A run that ends at 10 caps the score and ends a
  good run just when it gets interesting. The 10-placement goal is kept for multiplayer (Sprint 12) and the Daily Timeline (Sprint 10), where everyone needs the same finish line

### Facts this sprint starts from

- **Screenshots are not 1600×900 today.** `toWebp()` (`src/lib/imageEncode.ts`) keeps the aspect
  ratio and only scales the **longest edge** down to 1600. It never scales up, so older RAWG
  titles are stored at their native size (around 800 px wide). The 16:9 look comes from the card:
  `GameCard.svelte` renders `aspect-video object-cover`, so a 4:3 shot is silently cut at the top
  and bottom
- The current card is at most `max-w-2xl` (672 CSS px), or about 1344 physical px on a 2× screen
- `screenshots.difficulty` exists and every row says `medium`. `scores.difficulty` also exists
  (one real score, `medium`). "Primary" today means one primary per game
- There are no unit tests, and `scoring.ts` is pure, which also matters for Sprint 10

### Decisions made while planning (asked, not assumed — 2026-09-26)

- **A game can have a Normal shot, a Pro shot, or both.** A rare, little-known game may have
  **only** a Pro shot
- **Pro skips games without a Pro shot.** Pro must always be hard, even if its pool is small at
  first
- **Pro = harder screenshot + stricter bonus scoring.** Lives and the timer are the same in both
  modes
- **Crops are locked to 16:9**, so what the operator selects is exactly what the player sees
- **Solo is endless:** a run ends at 0 lives. **Every streak of 10 gives one life back**, up to
  the maximum of 3

### User Stories

- [x] US-8.1: As a player, I choose Normal or Pro on the welcome screen, and my choice is
      remembered
- [x] US-8.2: As a player, Pro shows only games that have a Pro screenshot and scores my bonus
      guesses more strictly
- [x] US-8.3: As a player, a run lasts until I lose my last life, and every streak of 10 gives a
      life back (max 3)
- [x] US-8.4: As a player, I see a proper end screen: placements, best streak, lives won back, and
      a "perfect run" when I have placed every game in the pool
- [x] US-8.5: As a player, my local leaderboard keeps Normal and Pro apart
- [x] US-8.6: As the admin, I can crop any screenshot, from RAWG or a file, to a 16:9 area before
      it is uploaded, and only the cropped part is stored
- [x] US-8.7: As the admin, I can give a game a Normal shot, a Pro shot or both, and I see at a
      glance which one a game is missing
- [x] US-8.8 (stretch): As the admin, I can re-crop an existing screenshot without searching RAWG
      again

### Tech Tasks

#### 8a — Content model (migration `0003`)

- [x] Difficulty values become `normal | pro`. The migration rewrites `medium` → `normal` in
      `screenshots` and `scores`. **Changing the column default is a table rebuild in SQLite**:
      review what `db:generate` produces against the lessons of `0002` (Drizzle also inlines a
      static default into the INSERT, so the code change has to ship with it)
- [x] "Primary" becomes **one primary per (game, difficulty)**. `addScreenshot()` marks the first
      shot of each difficulty primary, and "make primary" works within a difficulty
- [x] New nullable columns on `screenshots`: `source_url` (the RAWG image URL, or null for a
      file) and the crop rectangle in source pixels. This is expand-only and safe, and it enables
      US-8.8 and a per-screenshot source credit (see `ROADMAP.md` § Cross-cutting)
- [x] Live rule per mode: **published AND a primary screenshot of that difficulty.**
      `/api/games/random` and `/api/games` take `?difficulty=normal|pro` (default `normal`)
- [x] Admin: the game page has two slots, Normal and Pro. The list shows `NORMAL` / `PRO` chips.
      `NO SCREENSHOT` (red) means neither. `?missing=normal|pro` filter. The dashboard counts live
      games per mode
- [x] Runbook order: staging first, production at release, `db:dump` before each — staging and
      production both 2026-09-26, production migrated before the merge of PR #28

#### 8b — Crop tool

- [x] Recommended: **`svelte-easy-crop` 5.x**: Svelte 5 native, no dependencies, about 30 kB,
      maintained by the react-easy-crop author, and it returns a pixel rectangle. The fallback is
      a hand-rolled canvas crop (about 100 lines, but touch and keyboard handling are then ours).
      `cropperjs` 2 is web components without Svelte bindings, so it was not chosen. Verify the
      version at the start of the sprint. **Slice 3: the spike failed it on keyboard, so the
      fallback was built** — see "Slice 3 — what was built"
- [x] The flow for both pickers: choose an image (file or RAWG preview) → **crop step** → encode →
      upload. It feeds the one image pipeline: `toWebp()` gains an optional `crop` rectangle
      (`drawImage(bitmap, sx, sy, sw, sh, …)`), so there is still exactly one encoder
- [x] **The default rectangle is the largest centred 16:9 area.** That is exactly what
      `object-cover` shows today, so "upload without touching the crop" looks the same as now
- [x] Resolution rules (proposed, confirm at sprint start):
  - output = the crop, scaled so the longest edge is ≤ 1600, so **at most 1600×900**, never
    scaled up
  - **hard minimum 640×360 source pixels**: the tool will not zoom in further, so Pro crops cannot
    turn into pixel soup
  - **warning below 960×540**: "will look soft on large screens". Below the 1344 px the card
    needs on a 2× screen, but acceptable, and arguably part of Pro's charm
  - the output size is shown live while cropping
  - **Confirmed 2026-09-27 (decision 3)**, plus the edge case: a source whose largest 16:9 area
    is under 640 wide is locked at that area (pan only, red note) and can still be uploaded, in
    either tier — the minimum is a zoom limit, not an upload gate
- [x] Available for Normal shots too, to cut a logo or a watermark off an edge. The 7i-d batch
      needed exactly that and did it by script
- [x] Keyboard (arrow keys move, +/- zoom) and touch. The crop step lives in the `bits-ui` dialog
      like the lightbox
- [x] Verified in a real browser over CDP (see memory "browser-driving-over-cdp"), on the edit
      page and the create form — locally and on staging, see below

#### 8c — Gameplay

- [x] **Vitest first**: tests for `scoring.ts` and the placement logic (ties, the first and last
      slot, life regain) before any of it changes. Add `npm run test` to CI
- [x] Mode choice on `WelcomeScreen`, remembered in `localStorage`. Pro is shown only once its
      pool is at least `PRO_MIN_POOL` live games. **Decided in slice 4 (decision 1):** 100, shown
      as "Coming soon" below it, opens by itself, enforced by the server too
- [x] **Endless**: remove `TARGET_PLACEMENTS` from solo play. The client loads the mode's whole
      shuffled live pool in one request (a few hundred rows is small), instead of the fixed 14.
      Revisit at about 1000 games. The API's `count` cap (50) is raised accordingly
- [x] **Pool exhausted = perfect run.** The run ends with its own result, not an error. Decided in
      slice 1: a cleared pool is "Pool cleared!", and "Perfect run!" only with zero wrong placements
- [x] **Life regain**: at every streak multiple of 10, +1 life if below 3, with a visible
      animation. A wrong placement still resets the streak
- [x] **Pro scoring** (proposed numbers, confirm at sprint start):
  - year bonus: Normal stays 50 − 10 per year off (0 at ±5). Pro gives 50 exact, 25 at ±1, else 0
  - name bonus: Normal stays 50 exact / 35 close / 20 partial or subtitle. Pro gives 50 exact, 35
    close, else 0 (no credit for a subtitle or a substring)
  - **Decided in slice 4 (decision 2):** Pro as proposed. **Normal did not stay:** its year bonus
    is now 50 / 30 / 20 / 10 at 0 / 1 / 2 / 3 years off and 0 from ±4 ("a little too soft"). And
    in both modes an accent, apostrophe or hyphen no longer costs the exact name ("ghost of
    yotei" = Ghost of Yōtei)
- [x] `ResultScreen`: no "win" in solo any more. Game over with placements, best streak, lives won
      back. A perfect-run variant
- [x] Local leaderboard per mode. Old 10-game entries are not comparable with endless runs
      (**decided in slice 1: kept as a read-only "Classic" tab**). Slice 1 moved endless runs to
      `geekster-leaderboard-normal` and left `geekster-leaderboard` untouched; slice 4 only adds
      `geekster-leaderboard-pro`. The global `/api/scores` has no run-type column, so its single
      pre-endless rows (ids 1 and 2) were deleted at the slice-1 release instead of adding one.
      **Slice 4:** `geekster-leaderboard-pro` added, the global board split by
      `GET /api/scores?difficulty=`, Classic shown under Normal only
- [x] Long timelines: an endless run can reach 50+ cards. Check drag, auto-scroll and rendering
      on mobile, and add a compact view if it gets unwieldy. This is the polish risk of this sprint.
      **Slice 1 finding:** drag and edge auto-scroll held up at 55 cards on a 390 px phone (cards
      already collapse to one line while dragging), but tapping a slot meant ~14,000 px of
      screenshots to scroll through. Past 12 cards (`COMPACT_TIMELINE_AT`) the timeline and the
      result screen now show one line per game; the card just placed stays full-size
- [x] `scores.difficulty` is written as `normal | pro`. All new strings in EN and DE
- [x] Docs in the same commit: `CLAUDE.md` § Game Logic (win condition, lives, modes),
      `.claude/docs/game-architecture.md`, `.claude/docs/adding-games.md` (Normal/Pro, crop)

### Open decisions (ask at sprint start)

Decision 4 was answered at the start of slice 1 (2026-09-26): keep the old entries as "Classic".
Decision 3 at the start of slice 3 (2026-09-27): the thresholds as proposed, and a source too small
for 640×360 is locked at its largest 16:9 area rather than refused.

Decisions 1 and 2 at the start of slice 4 (2026-09-27):

1. `PRO_MIN_POOL`: its value (proposed 40), and whether Pro is hidden or shown as "coming soon"
   until then. **Answer: 100, shown as "Coming soon"** (visible, not selectable). The gate opens
   **by itself** when the live Pro count reaches 100 — no manual switch — and **the server
   enforces it too**
2. The Pro scoring numbers above. **Answer: Pro as proposed; Normal's year bonus tightened** to
   50 / 30 / 20 / 10 down to ±3, and an exact name tolerates accents, apostrophes, hyphens and a
   trailing "(year)"
3. The crop resolution thresholds above
4. Old local leaderboard entries: keep as "Classic" or clear

### Delivery order (decided 2026-09-26)

Four slices, each released on its own (`develop` → staging → PR into `main`) and each sized for
one session. What is fixed is the order and the scope; each slice is planned in detail only at
its start, because each one teaches the next something (what `db:generate` emits for `0003`,
whether `svelte-easy-crop` holds up, how a 50-card timeline feels on a phone). If a slice finds
the plan above wrong, this section is corrected in the same commit.

| Slice    | Content                                                                                    | Migration | Stories        | Open decisions asked at its start |
| -------- | ------------------------------------------------------------------------------------------ | --------- | -------------- | --------------------------------- |
| **1** ✅ | Vitest + CI, endless solo, life regain, perfect run, new result screen, leaderboard change | none      | 8.3, 8.4       | 4                                 |
| **2** ✅ | 8a: `0003`, primary per difficulty, `?difficulty=`, Normal/Pro slots in the admin          | `0003`    | 8.7            | —                                 |
| **3** ✅ | 8b: the crop tool in both pickers                                                          | none      | 8.6, 8.8 (str) | 3                                 |
| **4** ✅ | Pro in the game: mode choice, Pro scoring, leaderboard per mode, `PRO_MIN_POOL` gate       | none      | 8.1, 8.2, 8.5  | 1, 2                              |

**Slice 1 verified on staging (2026-09-26)**, headless Brave at 390 px over CDP, driven by a script
that looks up each card's year in `/api/games`:

| Check                                | Result                                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| one request for the whole pool       | `/api/games/random?count=1000` → 298 games (the old cap was 50)    |
| a run past 10 placements             | 14 correct, 4 wrong, then game over                                |
| a life back at a streak of 10        | 2 → 3 hearts on the 10th card in a row, banner and heart animation |
| touch drag in a longer timeline      | long-press, edge auto-scroll, dropped on the right slot            |
| result screen                        | placed / mistakes / best streak / lives won back, Classic tab      |
| locally: a whole pool (124 in a row) | "Perfect run!", result page 7,000 px with one line per game        |

The staging run's test row in staging's `scores` was deleted after the release.

#### Slice 2 — what was built (2026-09-26)

- **`0003_normal_pro`**, hand-written. `db:generate` emitted libSQL `ALTER COLUMN` statements
  (which rewrite no data) behind a `DROP INDEX` of an index that did not exist yet; its snapshot
  was kept, its SQL replaced by a rebuild of `screenshots` and `scores` in the style of `0002`.
  `screenshots.difficulty` is `text NOT NULL DEFAULT 'normal'`; `medium` → `normal` in both
  tables (`hard` would have become `pro`; none existed). New nullable columns `source_url`,
  `crop_x`, `crop_y`, `crop_width`, `crop_height`. Partial unique index
  `screenshots_primary_per_difficulty (game_id, difficulty) WHERE is_primary = 1` — checked first
  that no stage breaks it (every row on every stage was one `medium` primary per game).
  `sqlite_sequence` is carried across, including production's empty `scores` (seq 2). The
  extra `INSERT` for a missing sequence row turned out to be unnecessary — an empty copy still
  creates the row — and stays as a harmless guard
- **The primary rule is pure**: `reconcilePrimaries()` in `src/lib/screenshotTiers.ts`, 12 Vitest
  cases. Every mutation writes a row change that cannot create a second primary (insert and move
  as non-primary, delete), then reconciles the game's flags in one batch, clears before sets
- **Moving between tiers stays**, as a "Move to Pro/Normal" button instead of the old
  `easy | medium | hard` `<select>`: the moved shot arrives as an extra and never displaces the
  target tier's primary; the tier it left promotes its oldest remaining shot. Cheap fix for "wrong
  slot", and in slice 3 a Normal shot is a natural crop source for Pro
- `?difficulty=normal|pro` on `/api/games` and `/api/games/random` (default `normal`, anything
  else 400) through one shared query, `src/lib/server/liveGames.ts`. `POST /api/scores` stores
  anything but `normal | pro` as `normal`, which also covers tabs loaded before the deploy that
  still send `medium`
- Admin: two slot panels on the game page, one upload area + RAWG picker with an "Add to: Normal |
  Pro" toggle (same toggle on the create form); list chips `NORMAL` (green) / `PRO` (blue), red
  `NO SCREENSHOT` only with both empty; `?missing=normal|pro|both` (`missing=1` → `both`); the
  banner counts games without a Normal shot; dashboard "Live · Normal" / "Live · Pro"
- `source_url` is written by both RAWG paths (edit page and create form), kept only if it passes
  the rawg.io check. Crop columns stay null until slice 3
- **Two bugs found on the way.** (1) Without a join, Drizzle renders `${games.id}` as a bare
  `"id"`; in the admin list's correlated subqueries that bound to `screenshots.id`, so each row
  showed another game's thumbnail and shot count — now referenced as `"games"."id"` explicitly.
  (2) Pre-existing, made routine by two slots: `uploadScreenshot()` named shots `<slug>`,
  `<slug>-2`, … by counting, so after a delete the next upload overwrote a file still in use. The
  first fix (first free name per game) was sent back by the final review: names still collide
  across games (`foo`'s second shot vs. the first shot of slug `foo-2`), and reusing a deleted
  name serves the old image from the year-long cache. Admin uploads now get Vercel's random
  suffix, so a pathname is never reused
- **The dashboard banner counts games without a Normal shot** (review finding): with the game
  playing Normal only, a Pro-only game never appears in a round either

**`0003` proved on a copy of production** (2026-09-26): a fresh `db:dump -- --target=production`,
rebuilt locally with production's live DDL and `sqlite_sequence`, then `db:migrate` against that
file:

| Check                                          | Result                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| counts                                         | 298 games / 298 screenshots / 0 scores, unchanged                    |
| ids, `game_id`, `url`, `is_primary`, dates     | identical row for row; `games` (incl. `published`) identical         |
| blob URLs                                      | 298 of 298 still absolute blob URLs                                  |
| `difficulty`                                   | 298 × `normal`; `medium` left in either table: 0                     |
| new columns                                    | all null                                                             |
| `sqlite_sequence`                              | games 301 / screenshots 304 / scores 2 — carried, scores too         |
| `PRAGMA integrity_check` / `foreign_key_check` | ok / clean; FK still `screenshots.game_id → games.id`                |
| partial index                                  | a second Normal primary is rejected; a Pro primary beside it is fine |
| `NULL` difficulty / default                    | rejected / a bare insert gets `normal`                               |
| fresh inserts                                  | screenshot id 305, score id 3 — no id reused                         |
| a second `db:migrate`                          | no-op                                                                |
| the **old** `/api/games` query on the result   | 298 rows, 298 distinct games — old code keeps working                |

**Reviewed before staging** by a fresh subagent that had not written it: safe to apply, no
blockers. It re-ran the rebuild on its own fixtures (id gaps, a sequence above the max id, `NULL`,
`easy` and `hard` values, an empty `scores`): all preserved or mapped as intended; a forced
uniqueness conflict rolled the whole batch back cleanly; `drizzle-kit check` and a scratch
`generate` against the kept snapshot report no drift; `EXPLAIN QUERY PLAN` uses the partial index.
It corrected two runbook claims (foreign keys are **off** during `migrate()`; an empty copy does
keep its sequence row) and pointed out that the release check must cover writes made by the old
code between migration and deploy — all three now in the runbook and the release order below.

Also: `db:migrate` then `db:seed` on an empty file (0000–0003 from scratch) gives 125 `normal`
primaries; local `local.db` migrated after its own dump.

**Verified locally** against `npm run dev` (curl for the actions, headless Brave for the page):
adding a Pro shot left the Normal primary alone; a second Pro shot arrived as an extra; "Make
primary" swapped within Pro only, and ignored another game's shot id; moving the Normal primary
to Pro emptied Normal and kept Pro's primary; moving it back restored it; deleting a primary
promoted the next one; a Pro-only game shows only `PRO`, appears under `missing=normal`, and is in
`?difficulty=pro` but not in `/api/games`; a shotless game shows `NO SCREENSHOT` under all three
filters; the tier toggle followed "Add a Pro shot", and a RAWG import into Pro stored its
`source_url`; a bogus source URL was dropped; `difficulty=medium` got a 400 from the upload, the
create form and both APIs. Test games and their `staging/` blobs were deleted afterwards
(`list({ prefix })` empty).

**On staging (2026-09-26).** `db:dump -- --target=staging` (298 / 298 / 1), `db:migrate:staging`,
a second run as a no-op, then checked before pushing: screenshot rows identical to the dump,
298 × `normal`, the one score `normal`, seq 301 / 303 / 2, `integrity_check` ok,
`foreign_key_check` clean, the index present, no leftovers — and the **old** staging build still
served 298 distinct games on the migrated database. Then `develop` was pushed (CI green):

| Check on staging.geekster.pro                   | Result                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| the game plays                                  | 5 correct placements in a row, headless Brave, all Normal shots            |
| `/api/games`, `/api/games/random?count=1000`    | 298 / 298, one row per game                                                |
| `?difficulty=medium`                            | 400                                                                        |
| a Pro shot added to Doom through the admin      | Doom's Normal primary untouched; the Pro shot became Pro primary           |
| `/api/games?difficulty=pro` and `/random?…=pro` | only Doom                                                                  |
| admin list, search "Doom"                       | Doom once, `NORMAL` + `PRO`, Normal thumbnail; Doom (2016) `NORMAL`        |
| `?missing=normal / pro / both / 1`              | 0 / 297 / 0 / 0 of 298                                                     |
| dashboard                                       | Live · Normal 298, Live · Pro 1, "Without a shot" 0 (now "No Normal shot") |

The test Pro shot was deleted through the panel afterwards (its `staging/` blob with it,
confirmed with `list({ prefix })`; production's `doom.webp` untouched).

**Released 2026-09-26.** After PR #28 merged and the build went live on geekster.pro:
`/api/games` and `/random?count=1000` 298 / 298 distinct; `?difficulty=pro` `[]`;
`?difficulty=medium` 400; production holds only `normal` (298 screenshots, `scores` empty) — the
old build wrote nothing in the window; the admin list shows `NORMAL` chips and the dashboard
Live · Normal 298 / Live · Pro 0; five correct placements in headless Brave on geekster.pro (no
run ended, so no score was written). `develop` fast-forwarded to `main`.

**Production migrated 2026-09-26, before the merge** (steps 1–3 below, run by Claude on the
user's request): dump `backups/production-2026-09-26T21-55-01-945Z.json` (298 / 298 / 0), two
`db:migrate:production` runs (the second a no-op), then games and screenshot rows identical to
the dump, 298 × `normal`, seq 301 / 304 / 2 (scores carried while empty), `integrity_check` ok,
`foreign_key_check` clean, the index present, no leftovers — and the **old** build on geekster.pro
still served 298 distinct games, `/random?count=1000` 298. Steps 4–7 follow the merge.

#### Slice 2 — release order

The new code filters on `difficulty = 'normal'`. On an unmigrated database it finds only `medium`
and **the live pool is empty**. The migrated database, on the other hand, keeps the **old** code
working (proved above). So: migrate first, deploy second — never the other way round.

1. `npm run db:dump -- --target=production`
2. `npm run db:migrate:production`, then run it once more — must be a no-op
3. Check geekster.pro still serves the full pool with the **old** code:
   `curl -s https://geekster.pro/api/games | jq length` — same count as before
4. Merge the release PR `develop` → `main`; wait for the production deploy
5. Check: `/api/games` same count; `/api/games?difficulty=pro` → `[]`;
   `/api/games?difficulty=medium` → 400; `/admin/games` shows `NORMAL` chips; the game plays
6. Anything the old build wrote in the minute between 2 and 4 (an admin upload, a score from an
   open tab) still says `medium` (or `easy`/`hard`, which the old difficulty `<select>` allowed).
   Check: `SELECT difficulty, COUNT(*) FROM screenshots GROUP BY 1` and the same for `scores` —
   only `normal`/`pro` may appear. If not:
   `UPDATE screenshots SET difficulty='normal' WHERE difficulty NOT IN ('normal','pro')` (and the
   same for `scores`). A `medium` screenshot is invisible to the new code; the index cannot
   conflict, because the old code's primary logic kept one primary per game
7. Sync back: `git checkout develop && git merge --ff-only origin/main && git push`

Rolling the app back after step 4 is safe: the old code works on the migrated database.

Slice 1 goes first because it needs no migration: a migration waiting on staging holds up every
release behind it. Slice 1 keeps writing today's `difficulty` value; `0003` rewrites it.

#### Slice 3 — what was built (2026-09-27)

**The spike.** `svelte-easy-crop` 5.0.1 (peer `svelte ^5`, 30 kB, no dependencies), installed
without saving onto a throwaway route with a 960×540 seed image and driven in headless Brave:

| Requirement                 | Result                                                                                                                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fixed 16:9                  | ✅ `aspect={16/9}`; at zoom 1 the largest centred 16:9 area                                                                                                                                                                                                         |
| minimum in source pixels    | ✅ derivable: `maxZoom = largest 16:9 width / 640`; wheel zoom stopped at exactly 640×360                                                                                                                                                                           |
| keyboard                    | ❌ none — the container is focusable (`role="button"`) but has no key handler                                                                                                                                                                                       |
| keyboard added from outside | ❌ the bindable `crop` / `zoom` skip every clamp: zoom 1.8 past `maxZoom` 1.5 (533×300, under the minimum), the image dragged 300 px off-screen with the reported pixels no longer matching the view. Its clamp helpers are not exported (`exports` has only `"."`) |

So the 8b fallback: **`ScreenshotCropper.svelte`, hand-written**, same model as the library (a
fixed 16:9 window, the image moving behind it, the rest dimmed), but the state is a rectangle in
**source pixels** and every rule lives in **`src/lib/crop.ts`** (26 Vitest cases): `defaultCrop`,
`clampCrop`, `panCrop`, `zoomCrop` (anchored), `resizeCrop`, `cropOutputSize`, `cropQuality`,
`appendCrop` / `parseCrop`. Pointer Events for mouse and touch (one pointer pans, two pinch), a
non-passive wheel listener, a slider, + / − buttons, keys. No new dependency.

- **Where it lives:** inside `ImageLightbox`, which gained a `content` snippet. RAWG's "Use this
  screenshot" swaps the open preview for the crop view ("Back" returns); a picked file opens the
  lightbox straight into it. No nested dialog, one focus trap. In crop view an outside click is
  ignored (`interactOutsideBehavior`), so a stray click cannot throw a crop away; Escape still
  closes. Escape on the first crop of a picked file drops the pick; on "Crop again" it keeps the
  crop already chosen
- **One pipeline:** `toWebp(blob, { crop })` — `drawImage` with the source rectangle, output from
  `cropOutputSize()`, and it throws if the rectangle does not fit the decoded bitmap.
  `readImageSize()` decodes the same way, so the crop is always drawn on the pixels that get cut.
  `MAX_EDGE` moved to `crop.ts` (re-exported)
- **Untouched default is stored as a rectangle**, not null: for a 4:3 source the default is a real
  cut, and it is where a re-crop starts. Null keeps one meaning — a shot from before slice 3
- **Server:** both actions pass `parseCrop(form)` to `addScreenshot()`. Untrusted input, dropped to
  null unless: plain integers, the source size 1…20000, inside the source, `|16h − 9w| ≤ 16`,
  width ≥ `min(640, largest 16:9 width of the source)`. The edit page shows `Crop W×H at x,y`
- **Too small for the minimum is common, not rare:** 6 of the first 40 seed images (256×224,
  320×240, 512×352, 552×414, 560×384, 600×337) cannot hold 640×360; 640×480 holds exactly it

**Verified locally** (`npm run dev`, headless Brave over CDP; the stored WebP's size read from its
RIFF header):

| Page / picker / tier   | Check                                                                                                       | Stored                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| create · file · Pro    | keyboard only: focus opens on the stage, + × 40 stops at 640×360, arrows, Shift, clamped at the edge, Enter | `1920,353,640,360` → WebP 640×360         |
| edit · file · Normal   | untouched 800×600 → default `0,75,800,450`                                                                  | WebP 800×450                              |
| edit · file · Normal   | 320×240: slider and + disabled, red note, pan only                                                          | `0,0,320,180` → WebP 320×180              |
| edit · RAWG · Pro      | wheel zoom anchored under the pointer, mouse drag, outside click ignored, Back → preview arrows again       | `129,72,769,433` + `source_url` → 769×433 |
| create · RAWG · Normal | untouched default                                                                                           | `0,0,1024,576` + `source_url` → 1024×576  |
| edit · file · Normal   | touch pinch zoom + touch drag, Reset, "Crop again", Escape keeps it                                         | `0,0,2560,1440` → WebP **1600×900**       |
| edit · forged posts    | not 16:9, negative, outside, under 640 — each through `?/upload`                                            | uploaded, all four `crop_*` null          |
| edit · file · cancel   | Escape on the first crop                                                                                    | nothing selected, file input empty        |

Test games deleted through the panel; `list({ prefix: 'staging/screenshots/crop-test' })` empty.

**Reviewed** by a fresh subagent over the whole diff: nothing serious; fixed in a follow-up commit
and re-checked in the browser — Escape during the encode no longer resurrects a cancelled pick (the
dialog refuses to close while busy, and every `await` checks it is still the current pick); a RAWG
fetch that lands after the operator stepped on or closed is discarded, and the object URL is freed
on unmount; opening a file and cancelling its crop no longer drops a RAWG choice on the create form
(`onselect` fires on a confirmed crop); a pinch zooms about where the fingers started; Cmd/Ctrl
zoom keys are left to the browser; Firefox's line-mode wheel is scaled; focus returns to "Use this
screenshot" after "Back"; `parseCrop` rejects a zero height.

#### Slice 3 — re-crop, the stretch (US-8.8)

Built after the core was committed, reviewed and on staging. "Crop again" on each shot of the edit
page (`RecropDialog.svelte`); the result **replaces** the shot or is **added as a new Normal/Pro
shot**. What it can crop from:

| Shot                             | Crops from                                                             | Crop can         | Stored `crop_*`                                           |
| -------------------------------- | ---------------------------------------------------------------------- | ---------------- | --------------------------------------------------------- |
| RAWG (`source_url`)              | the original again, through the proxy, opening on the stored rectangle | widen or tighten | as drawn — same pixel space as before                     |
| uploaded file (slice 3 on)       | the stored WebP — the original is gone                                 | tighten only     | mapped back into the original by `recropFromStored()`     |
| seed / pre-slice-3 (`crop` null) | the stored image                                                       | tighten only     | as drawn — the stored image is the only original there is |

A Normal shot as the source of a Pro crop falls out of this: "Add as a new Pro shot". The new row
takes `source_url` from the shot it was cut from — the server reads it from the row, never from the
form. Replacing keeps the row id, tier, primary flag and source, uploads a new blob (never the old
pathname, so no cache trouble) and deletes the old one through the stage guard (on staging a
production blob is therefore left alone). Everything still rides on `?/upload`: `recropOf`,
`cropBase=source|stored`, `replace=1`, plus the usual crop fields. `recropFromStored()` scales by
the size the stored image is claimed to have, bounded to 16:9 and no wider than the previous crop
(a stored image is never scaled up), and clamps the result inside it; a stored-base crop of a RAWG
shot that has no crop yet (a slice-2 import) is stored as null. 8 more Vitest cases (34).

**Found on staging, fixed before the release:** the first version required the stored image to be
exactly `cropOutputSize(previous crop)`. That holds after a first upload, but not after a replace
from the stored image: the new WebP keeps the stored image's resolution (1323×744) while `crop_*`
says 2117×1191 in the original, so a second re-crop of that shot was stored with a null crop.
Staging's test run (replace, then "Add as a new Pro shot" from the replaced shot) showed it; the
local run had never re-cropped a replaced shot. The review subagent on the re-crop commit found the same bug independently;
it also pointed out an object URL leaked when the dialog unmounts mid-load (fixed) and that the
edit page's RAWG upload read an action `fail()` (HTTP 200) as success (fixed, `deserialize`). Left
as is: two overlapping replaces of one shot, or a delete between its select and update, can orphan
a blob — operator-only, and an orphaned file is the recoverable failure the stage guard accepts.

**On staging after the fix** (`ebce0b9`, headless Brave): a 2560×1440 file → stored 1600×900;
"Crop again" → Replace at `139,78,1323,744` stored → row `222,125,2117,1191`, WebP 1323×744; then
"Crop again" on that replaced shot → "Add as a new Pro shot" at `165,93,994,559` → Pro primary
`486,274,1591,895`, WebP 994×559 — the pre-fix build had stored that one with a null crop. Staging
has no `RAWG_API_KEY` (Preview never had one), so the RAWG re-crop was verified locally only. Test
games deleted through the panel; `list({ prefix: 'staging/screenshots/crop-staging' })` empty.

**Verified locally** (headless Brave): a 2560×1440 file stored at 1600×900, re-cropped to
`277,78,1323,744` in stored pixels → the same row `443,125,2117,1191` (×1.6), still primary, new
WebP 1323×744, the old blob gone from `list({ prefix })`; a RAWG shot re-opened exactly on its
stored `0,135,1442,811`, widened and added as Pro → a new Pro primary `0,50,1745,982` with the
RAWG `source_url`, the Normal shot untouched; a seed shot (`/screenshots/…`, crop null) → a new Pro
shot `70,115,661,372`, the seed row untouched; `recropOf` of another game's shot → 400. Test data
deleted through the panel afterwards.

#### Slice 3 — found in the staging test by the user (2026-09-27)

Before the release PR was merged, the user tried adding a Pro shot to an existing game on staging:

- **A cropped file was never saved.** On the edit page, "Use this crop" only prepared the WebP;
  a separate **Upload** button next to the file input sent it, and nothing pointed to it. The
  Pro slot stayed empty. Pressing the details form's **Save** — the one form on that page
  without `use:enhance`, so a full-page POST — reloaded the page and dropped the pick. The create
  form never had the problem, because "Create game" carries the shot. **Fixed:** on the edit page
  a confirmed crop is added at once, file or RAWG ("Add to Pro"), a green note says where it went,
  the new row is outlined; the Upload button is gone; the details form is enhanced
  (`reset: false`) and its button reads "Save details", with a line saying screenshots save as
  they are added
- **"Changing" a shot with RAWG kept showing the old thumbnail.** Reproduced on the current build:
  the URLs are right everywhere (edit page, list by link and by back, a replaced image), so the
  cache half of this report was the pre-slice-2 naming bug — `<slug>.webp` reused under a
  year-long cache — fixed in PR #28 by random-suffix pathnames. What remained was the rule: a
  shot added to a filled slot silently became a non-primary extra, so the slot's thumbnail and
  the list kept showing the old primary. **Fixed:** for a filled slot the add area shows "Make it
  the … primary" (ticked by default); `makePrimary=1` makes the new shot primary, the old one
  stays as an extra. Unticked, the note says the primary is unchanged

Verified locally in headless Brave: Pro added to a Normal-only seed game straight from the crop;
a Pro-only game's toggle defaults to Normal and a Normal shot lands there; a RAWG shot into the
filled Normal slot became primary (slot, database and list thumbnail agree), and with the box
unticked arrived as an extra; "Save details" changed the year without a page reload.

#### Slice 3 — released

PR #30 merged; production deployed `b8efd3c`, `develop` fast-forwarded to `main`. Checked live,
read-only: `/api/games` and `/random?count=1000` 298 / 298, `?difficulty=pro` 0 (unchanged — no
player-facing change in this slice); a game's admin page serves "Save details", "Add a
screenshot" and "Crop again", and no Upload button. Nothing was written to production.

#### Slice 4 — what was built (2026-09-27)

- **Scoring** (`scoring.ts`): the three functions take the mode as an optional last argument,
  default `normal`. Year bonus is a table per mode (`YEAR_BONUS`); Pro's name bonus is exact or
  close, nothing else. The exact-name check compares with accents folded (NFKD, marks dropped),
  punctuation and apostrophes removed, spaces removed, and a trailing parenthesis optional. Pro
  tests were written first; the Normal tests stayed as they were **except the year curve**, which
  decision 2 changed on purpose (and the rounding test that used a 1-year-off guess: 154 → 143)
- **Found in the review, fixed before the release:** Dice over character pairs barely moves
  when one number changes, so "Far Cry 4" for "Far Cry 3" or "Portal 2" for "Portal" scored 35
  as a close spelling — in Normal since Sprint 4, and against the point of Pro. "Close" now needs
  the same numbers, Roman numerals read as digits ("Final Fantazy 7" is still close to "Final
  Fantasy VII"). Also: the welcome screen falls back to the last run's mode where storage is
  blocked, a failed reload after a 409 is caught, and the disabled Pro radio is described by its
  "opens at 100" line
- **Modes** (`src/lib/modes.ts`, tested): `PRO_MIN_POOL`, `isProOpen()`, `resolveProMinPool()`,
  `playableMode()`, and the `geekster-mode` storage helpers
- **The gate, and how the welcome screen learns the count.** `/` got a server load
  (`src/routes/+page.server.ts`) returning `getProGate()` — one `COUNT` over the live rule
  (`countLiveGames()` in `liveGames.ts`), so "Coming soon" is in the first HTML and no pool is
  downloaded for it. A DB error reads as closed
- **Why the server enforces it too:** the gate is about quality, not secrecy, but a client-only
  gate lets a stale tab or a typed URL play a one-game "Pro run" and write it into the global Pro
  board, which could only be cleaned by hand. So `/api/games/random?difficulty=pro` answers 409
  below the minimum (the whole-pool request's length is the count; a request the limit cut short
  runs the `COUNT`), and `POST /api/scores` refuses `pro` with 409 while closed.
  `/api/games?difficulty=pro` stays open — its data is public anyway. On a 409 at start the client
  re-runs the page load, so the welcome screen selects Normal and "Try again" plays Normal
- **How Pro is verified while gated:** `PRO_MIN_POOL_OVERRIDE`, a server env var read only when
  `VERCEL_ENV` is not `production` (`resolveProMinPool()` ignores it there, unit-tested). Locally
  it is passed on the command line; on staging it is a **Vercel Preview variable — a dashboard
  step only the user can do** (it then applies to every feature preview too, harmlessly)
- **Game state:** `GameState.mode`, set by `startGame(mode)`, kept by `restartGame()`. A stored
  Pro while closed plays Normal without an error and the stored value is kept
- **UI:** `ModeChoice.svelte` (radio pair, Pro disabled with an amber "Coming soon" and a line
  saying it opens at 100), a `PRO` badge in the HUD, a `NORMAL`/`PRO` badge on the result screen
- **Leaderboards:** `geekster-leaderboard-<mode>`; Classic under Normal only; the Global tab reads
  `GET /api/scores?difficulty=<mode>` (new parameter; 400 for an unknown value; none = all modes);
  the result screen posts its mode instead of the hardcoded `normal`

**Verified locally (2026-09-27)**, headless Brave at 390 px over CDP, `local.db` with 12 temporary
Pro rows (Normal images with a `?tier=pro` marker; the database was restored afterwards):

| Check                         | Result                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------- |
| gate closed (no override)     | Pro "Bald verfügbar", radio disabled, a click selects nothing; API 409 for Pro    |
| stale Pro choice while closed | Normal selected, no error, run requests `difficulty=normal`, stored `pro` kept    |
| Normal year curve             | 0 / 1 / 2 / 3 / 4 off → +50 / +30 / +20 / +10 / +0; (100 + 30) × 1.1 = 143        |
| Normal end of run             | NORMAL badge, `-normal` list only, POST `normal` 201, Global `?difficulty=normal` |
| mode memory                   | Pro survives a reload                                                             |
| Pro run (override 10)         | `difficulty=pro`, PRO in HUD, all 12 shots `tier=pro`, "Perfekter Lauf!" after 11 |
| Pro scoring                   | year +50 / +25 / +0; subtitle alone +0; "grand theft auto san andreas" +50        |
| Pro leaderboards              | PRO badge, `-pro` list only, POST `pro` 201, Global `?difficulty=pro`, no Classic |
| Play Again / Main Menu        | a Pro run again; menu shows Pro and "Bestenliste (Pro)"                           |
| layout at 390 px              | no horizontal scroll, nothing clipped on the four screens                         |

**Verified on staging (2026-09-27)**, headless Brave at 390 px over CDP, on `44a770d`. The user
set **`PRO_MIN_POOL_OVERRIDE=5` in Vercel's Preview environment** (it stays set; it applies to
every feature preview too). Staging had 1 live Pro game, so 12 temporary Pro rows were inserted
into staging's `screenshots` (Normal URLs + `?tier=pro`, after a `db:dump`) and deleted by that
marker afterwards, together with the three `scores` rows the run posted (ids 3–5):

| Check                        | Result                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| gate closed (before the var) | "Bald verfügbar", `random?difficulty=pro` 409, Pro `POST /api/scores` 409                                         |
| Pro open, mode memory        | selectable, survives a reload                                                                                     |
| full Pro run                 | `difficulty=pro`, PRO in HUD, all 13 cards from the Pro list; pool cleared, 1874 points                           |
| Pro bonuses                  | year +50 / +25 / +0; "super mario bros" +50, "Minecraf" +35, "Wild Hunt" +0, "Red Dead Redemption 3" +0           |
| Pro result, Play Again, menu | PRO badge, `-pro` list only, POST `pro` 201, Global `?difficulty=pro`, no Classic; Play Again Pro; menu keeps Pro |
| Normal                       | `difficulty=normal`, year +50 / +30 / +20 / +10 / +0, NORMAL badge, POST `normal` 201                             |
| layout at 390 px             | `scrollWidth` 390 on welcome, HUD and result                                                                      |

**Vercel's Git integration did not build the second push** (`44a770d`, CI ran green, no
deployment appeared). It was deployed by redeploying the previous `develop` deployment with
"latest commit" through the Vercel MCP (`create_deployment` with `deploymentId` +
`withLatestCommit`), and staging.geekster.pro was aliased to it. After a push, check that a
deployment for that SHA exists before testing staging.

#### Slice 4 — released

PR #31 merged; production deployed `ffb4bd9`, `develop` fast-forwarded to `main`. Checked live,
read-only (the one POST is refused and writes nothing):

| Check on geekster.pro                    | Result                                               |
| ---------------------------------------- | ---------------------------------------------------- |
| welcome screen                           | Pro locked, "Bald verfügbar", "öffnet, sobald 100 …" |
| `/api/games/random?difficulty=pro`       | 409 — 1 live Pro game against 100                    |
| `/api/games/random?count=1000` (Normal)  | 298 games, as before                                 |
| `/api/scores?difficulty=pro` / `=medium` | `[]` 200 / 400                                       |
| `POST /api/scores` with `pro`            | 409                                                  |

### Definition of done

Released to production through `develop` → `main`. The crop flow has been clicked through in a
real browser. Pro is live only once its pool meets `PRO_MIN_POOL`. Until then it is on
production but not offered.

**Met (2026-09-27)** with slice 4's release (PR #31): every 8c box is ticked, the crop flow was clicked
through in slice 3, and Pro is **on production but not offered** — "Coming soon" until 100 games
are live in Pro, then it opens by itself.

---

## Appendix: the Sprint 8 record from "Where things stand"

| Sprint 8 slice                                              | Status                                         |
| ----------------------------------------------------------- | ---------------------------------------------- |
| **1** — Vitest + CI, endless solo, life regain, perfect run | ✅ released to production, PR #27 (2026-09-26) |
| **2** — `0003`, primary per difficulty, admin Normal/Pro    | ✅ released to production, PR #28 (2026-09-26) |
| **3** — crop tool + re-crop (US-8.6, US-8.8)                | ✅ released to production, PR #30 (2026-09-27) |
| **4** — Pro in the game (US-8.1, 8.2, 8.5)                  | ✅ released to production, PR #31 (2026-09-27) |

**Slice-1 release hand step — done 2026-09-26**, right after PR #27 merged: `db:dump -- --target=production`
(`backups/production-2026-09-26T21-04-42-500Z.json`), then both pre-endless rows deleted from
production's `scores`: id 1 (1925, a 10-game win) and id 2 (1577, a 10-game loss played at
15:09 UTC, before the endless build existed). Production's global list starts empty under endless
play. The slice-1 verification run's test row on staging was deleted too (after a staging `db:dump`).
