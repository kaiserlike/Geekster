# Geekster - Sprint Plan

A timeline guessing game for video game screenshots. Similar to Hitster, but instead of songs, players place video game screenshots in chronological order.

## Tech Stack

- **Frontend/Backend:** SvelteKit (Svelte 5 runes, TypeScript)
- **Styling:** Tailwind CSS v4; `bits-ui` for the admin panel's dialogs
- **Database:** Turso (libSQL) via Drizzle ORM — the single source of truth since Sprint 7a.
  `games.json` is seed data only
- **Images:** Vercel Blob, one store, `staging/` prefix outside production
- **Hosting:** Vercel — `main` → <https://geekster.pro>, `develop` → <https://staging.geekster.pro>

> The early sprints below describe the stack as it was at the time (a JSON file, GitHub Pages).
> They are kept as a record, not as instructions. `CLAUDE.md` always describes the current state.

## Where things stand

Sprints 1 through 7 are complete and live. **Sprint 8 is complete**, in the four slices of
§ Sprint 8 "Delivery order". Slices 1 and 2 are released to production (PR #27 and #28,
2026-09-26); `0003` is applied on all three databases. Slice 3 (the crop tool and re-crop) is released
too (PR #30, merged 2026-09-26 23:29 UTC, no migration). **Slice 4 (Pro in the game) is released
too (PR #31, 2026-09-27, no migration).** Pro ships gated: production has 1 live
Pro game against `PRO_MIN_POOL` = 100, so players see it as "Coming soon" until the pool fills.
**Now: § Sprint 9** (the redesign), planned in detail 2026-09-27. Slice 9a is designed: direction
M3 (turquoise synthwave) is chosen, and the canvas page "M3 · Full design" holds every screen, the
tokens and the brand assets. The user approved it (with the desktop long-timeline board added). **9b (the
foundation in code) is done on `develop`** (2026-09-27, verified on staging) and is **not
released on its own**: the user decided on 2026-09-28 to release it together with the redesign.
**9c, 9d, 9e, 9f and 9g are done on `develop`** (2026-09-28). **Every Sprint 9 slice goes to
`develop` and staging as it's finished; nothing goes to `main` until Sprint 9 is complete**
(decision 10). **Sprint 9 is complete and released to production** (PR #32, merged
2026-09-28, `557f7e4`, no migration; production checks in § 9g). **Next: Sprint 10**, planned in advance on 2026-10-02 (start at its "Start here"), moved
ahead of Sprint 8m on 2026-10-02 after the first playtest (§ Playtest feedback, 2026-10-02);
8m follows it. Two bugs from that playtest are fixed and the decade labels removed, **released
to production** (PR #33, merged 2026-10-03, `908addc`, no migration; checked on geekster.pro over
CDP: no decade labels, no decade during the bonus, one shrink per drag without flicker).
**10a is done** (slug-free images, functions in `dub1`; production's images renamed
2026-10-04), **released** (PR #34, merged 2026-10-03 22:14 UTC, `58d1f9e`, no migration;
production answers from `dub1`, median 78 ms). **10b (the referee) is released** (PR #35,
merged 2026-10-04, `7412b79`; `0004` on all three databases, production migrated before the
merge; the 19 unverified `scores` rows deleted after a dump). **10c (names and the global
board) is built on `develop`** (2026-10-04, no migration; decisions and the local verification
in § 10c). 10c is verified on staging and **waits there: by the user's decision of 2026-10-04 nothing goes to `main` until Sprint 10 is complete**, then one release. **10d (the Daily Run) is built and verified on staging** (`0005` there).
**10e (share) is built on `develop`** (2026-10-04, no migration; § 10e). 10e is verified on staging (a
real phone is the user's step). **10f (anonymous share counts, migration `0006`) is verified on
staging** (§ 10f). **Sprint 10 is complete and released to production** (PR #36, merged
2026-10-04 17:24 UTC, `293a647`; `0005` and `0006` on production before the merge; `develop`
synced; the production check is in § 10f). **Next: Sprint 8m** (migrations applied by the
pipeline).

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

Sprint 7, for the record:

| Task                                                       | Status                                                                |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| **7h-a** — baseline the Drizzle migrations                 | ✅ done; the diff was **not** empty, see 7h-a                         |
| **7h-b** — the migration runbook                           | ✅ `.claude/docs/schema-migrations.md`, plus stage-named `db:migrate` |
| **7h-d** — `db:dump`                                       | ✅ done                                                               |
| **7i-a** — draft mode: `games.published`, migration `0001` | ✅ released and verified live                                         |
| **7i-b** — one image pipeline: RAWG proxy + browser WebP   | ✅ done                                                               |
| **7i-c** — preview a RAWG screenshot before choosing it    | ✅ done                                                               |
| **7h-c** — `db:refresh-staging`                            | ✅ written and run                                                    |
| **7i-e** — the RAWG picker on the create form              | ✅ done, clicked through in a real browser                            |
| **7i-d** — add the new games as drafts, review, publish    | ✅ reviewed and published 2026-09-26                                  |

The live game count is deliberately not written down here: it changes every time a game is
published or deleted. The admin dashboard shows it, and `/api/games` is what players get.

### Hand steps outstanding

None in Sprint 7. Everything is **released to production**: PR #19 (merged 2026-09-20) for 7h
and 7i-a/b/c, then PR #21 → #22 (merged 2026-09-21) for 7i-e. Verified live on 2026-09-20/21:

| Check on geekster.pro      | Result                                                 |
| -------------------------- | ------------------------------------------------------ |
| unpublish a game, re-check | gone from `/api/games` and the round; restored after   |
| submit a score             | `created_at` = `2026-09-20 19:10:33`, a real timestamp |
| `/admin/games/new`         | serves the RAWG picker, so 7i-e is live (2026-09-26)   |

Staging was refreshed from production right after the publish (`db:refresh-staging`,
2026-09-26), so it carries the 7i-d games too.

#### The `created_at` corrective

`drizzle/0002_created_at_default.sql`, hand-written. `schema.ts` and the stored snapshot have
always described the correct default, so `db:generate` sees no diff and produces nothing — the
drift existed only in the live databases.

It rebuilds all three tables (SQLite cannot alter a column default), backfilling the literal
`CURRENT_TIMESTAMP` strings to `NULL`. The real creation times are unrecoverable and the column is
already `string | null`; inventing a date would have been worse than admitting the gap.

Verified by rebuilding production locally from a `db:dump` — with the **broken** DDL — and running
`npm run db:migrate` against that file:

| Check                                          | Result                                            |
| ---------------------------------------------- | ------------------------------------------------- |
| counts                                         | 127 games / 127 screenshots / 0 scores, unchanged |
| literal `CURRENT_TIMESTAMP` remaining          | 0                                                 |
| `published`, blob URLs, ids 1–127              | all preserved                                     |
| `sqlite_sequence`                              | 128 / 129 carried across, so no id is reused      |
| `PRAGMA foreign_key_check` / `integrity_check` | clean / ok                                        |
| a fresh insert                                 | `2026-09-20 18:51:03` — a real date               |
| a second `db:migrate`                          | no-op                                             |

Applied to local, staging **and production**, each after a `db:dump`.

**The migration alone did not finish the job.** Drizzle inlines a static `.default()` value into
the INSERT it sends, so the application wrote the literal string whatever the column default said.
Proved on production right after the migration: a direct `INSERT` with no `created_at` stored
`2026-09-20 19:00:07`, while the same insert through the live API stored `CURRENT_TIMESTAMP`,
because the deployed build predated the ``sql`CURRENT_TIMESTAMP` `` fix in `schema.ts`.

**Both halves are live as of PR #19.** The same API call now returns `2026-09-20 19:10:33`. The
lesson is kept in the runbook: when a default is wrong, check whether the ORM is also sending it,
and treat the deploy as part of the fix.

Then Sprint 8 — Normal / Pro, the crop tool and endless mode. It **does** need a migration
(`0003`): the difficulty values change, "primary" becomes per difficulty, and a screenshot gains
its source and crop. The product direction behind it is in `ROADMAP.md`.

Every change is committed on `develop` (deploys to staging), then released by a PR `develop` →
`main` (deploys to production); `main` requires a passing CI run, and `develop` is fast-forwarded
to `main` after each release. Feature branches only for large or experimental work — see
`CLAUDE.md` § Deployment & CI (changed 2026-09-26; before that every change took a
`feature/*` PR into `develop`).

---

## Sprint 1 - Foundation & Core Game Loop (MVP) ✅

> Goal: A playable single-player game with hardcoded data

### User Stories

- [x] US-1.1: As a player, I see a welcome screen with a "Start Game" button
- [x] US-1.2: As a player, I see a first screenshot with its release year as the anchor on a timeline
- [x] US-1.3: As a player, I see a new screenshot and must place it before or after the existing one(s)
- [x] US-1.4: As a player, I get visual feedback whether my placement was correct or wrong
- [x] US-1.5: As a player, I win when I have 10 games correctly placed in the timeline
- [x] US-1.6: As a player, I see a game-over/win screen with the final timeline

### Tech Tasks

- Project setup (SvelteKit + Tailwind CSS + TypeScript)
- Game data as JSON (15-20 games with name, year, screenshot placeholder)
- Core game state logic (timeline, placement validation, win condition)
- Basic responsive UI

---

## Sprint 2 - Game Database & Polish ✅

> Goal: Enough content for replayability, better UX

### User Stories

- [x] US-2.1: As a player, I get a different set of games each round (randomized from 55-game pool)
- [x] US-2.2: As a player, I see smooth animations when placing a game in the timeline
- [x] US-2.3: As a player, I see the game name + year revealed after placing it
- [x] US-2.4: As a player, I can restart the game after winning or losing
- [x] US-2.5: As a maintainer, I can easily add new games to the database

### Tech Tasks

- ~~Migrate from JSON to SQLite database~~ (deferred to Sprint 4)
- CLI tool for adding games (`npm run game:add`)
- Expanded to 55 games in JSON database
- Animations: fly transitions, fade transitions, slide reveal
- Reveal flow: name + year shown for ~2s after placement
- "Play Again" (restart) and "Main Menu" buttons on result screen
- Sticky current card + larger touch targets on mobile

---

## Sprint 3 - Lives, Streak & Drag-and-Drop ✅

> Goal: More engaging gameplay with tactile interactions

### User Stories

- [x] US-3.1: As a player, I can drag and drop the current game card into the available timeline slots
- [x] US-3.2: As a player, I have limited wrong guesses (3 lives)
- [x] US-3.3: As a player, I see my current score and streak
- [x] US-3.4: As a player, during drag the existing timeline games get minified (year + title only) to minimize scrolling

### Tech Tasks

- Drag and drop: HTML5 DnD for desktop + custom touch drag (long-press) for mobile
- Timeline card minification during drag (compact name + year bars)
- Lives/health system (3 lives, game over at 0)
- Streak tracking (consecutive correct placements)
- Updated header UI: lives indicators + streak counter
- Auto-scroll during touch drag near viewport edges
- Updated welcome screen instructions

---

## Sprint 4 - Bonus Points & Knowledge ✅

> Goal: Reward deeper gaming knowledge

### User Stories

- [x] US-4.1: As a player, I can optionally guess the exact release year for bonus points
- [x] US-4.2: As a player, I can optionally guess the game's name for bonus points
- [x] US-4.3: As a player, I see a final score that reflects both ordering + bonus points
- [x] US-4.4: As a player, I see a leaderboard of my own past scores (local storage)

### Tech Tasks

- Bonus point input UI (year guess, name guess)
- Scoring algorithm (proximity-based for year, fuzzy match for name)
- Local storage leaderboard

---

## Sprint 5 - Real Screenshots & UI Polish ✅

> Goal: Production-quality visuals

### Tech Tasks

- [x] Replaced SVG placeholders with real game screenshots
- [x] Screenshot audit: replaced images showing game titles/logos with clean gameplay shots
- [x] i18n support with language switcher
- [x] GitHub Pages deployment

---

## Sprint 6 - Backend Foundation & Database ✅

> Goal: Migrate from static JSON to a real backend with database, enabling future admin panel, multiplayer, and global leaderboard

### Why Now

The static JSON + GitHub Pages approach works for the current game, but cannot support:

- Admin panel for managing games/screenshots without git
- Multiple screenshots per game (difficulty levels)
- Global leaderboard (requires server-side persistence)
- Multiplayer (requires real-time server)

### Architecture Decisions

| Component         | Choice                                               | Rationale                                                                                                                     |
| ----------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Backend**       | SvelteKit API routes (`+server.ts`)                  | Already using SvelteKit; no separate server needed                                                                            |
| **Database**      | SQLite via **Turso** (libSQL)                        | Free tier (500 DBs, 9 GB, 500M reads/mo). Relational data model fits game/screenshot/score relationships. No server to manage |
| **ORM**           | **Drizzle**                                          | Type-safe, lightweight, excellent SQLite/Turso support                                                                        |
| **Image storage** | **Vercel Blob**                                      | Free tier, no git bloat, CDN-backed. Chosen over R2: same platform, one env var, no S3 SDK                                    |
| **Hosting**       | **Vercel** (move from GitHub Pages)                  | Free tier supports SSR + API routes. GitHub Pages is static-only                                                              |
| **Auth (admin)**  | Simple password via env var (upgrade to OAuth later) | Minimal setup for single-admin use case                                                                                       |

### Database Schema

```sql
-- Core game data
games (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  year        INTEGER NOT NULL,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
)

-- Multiple screenshots per game, with difficulty
screenshots (
  id          INTEGER PRIMARY KEY,
  game_id     INTEGER REFERENCES games(id),
  url         TEXT NOT NULL,          -- R2/blob URL
  difficulty  TEXT DEFAULT 'medium',  -- easy | medium | hard
  is_primary  INTEGER DEFAULT 0,     -- shown by default
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
)

-- Global leaderboard
scores (
  id                INTEGER PRIMARY KEY,
  player_name       TEXT NOT NULL,
  total_score       INTEGER NOT NULL,
  correct_placements INTEGER,
  wrong_placements  INTEGER,
  best_streak       INTEGER,
  difficulty        TEXT DEFAULT 'medium',
  created_at        TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### User Stories

- [x] US-6.1: As a developer, the game loads data from an API instead of a static JSON file
- [x] US-6.2: As a developer, game data is stored in a SQLite database (Turso)
- [x] US-6.3: As a developer, screenshots are served from blob storage instead of the git repo
- [x] US-6.4: As a developer, I can deploy the app to Vercel with SSR support
- [x] US-6.5: As a player, the game works exactly as before (no visible changes)

### Tech Tasks

#### 6a — Database Setup

- [x] Install Drizzle ORM + Turso client (`@libsql/client`, `drizzle-orm`, `drizzle-kit`)
- [x] Define schema in `src/lib/server/schema.ts`
- [x] Configure Drizzle for Turso connection (`drizzle.config.ts`)
- [x] Create and run initial migration
- [x] Write seed script: import all 125 games from `games.json` into the database

#### 6b — API Routes

- [x] `GET /api/games` — list all games (used by game logic)
- [x] `GET /api/games/random?count=10&difficulty=medium` — get random game set for a round
- [x] `POST /api/scores` — submit a score to the global leaderboard
- [x] `GET /api/scores?limit=20` — fetch top scores

#### 6c — Screenshot Migration

Provider decision: **Vercel Blob** over Cloudflare R2 — already on Vercel, one package
(`@vercel/blob`) and one env var, and 5 MB of screenshots is far inside the free tier.

- [x] Choose provider and install the client (`@vercel/blob`)
- [x] Write migration script: `npm run blob:migrate` — uploads `static/screenshots/*.webp`,
      then rewrites `screenshots.url` in the database (`--dry-run` / `--force` supported)
- [x] Update frontend to handle absolute blob URLs (`resolveScreenshotUrl()` in `src/lib/imageUrl.ts`)
- [x] Create the Blob store and set `BLOB_READ_WRITE_TOKEN` — store `geekster-screenshots`
      (`store_INcAJWeUsvrWGj0t`, region fra1, **access: public**). Note: a store's access mode is
      fixed at creation; a private store cannot serve images to `<img src>`
- [x] Run `npm run blob:migrate` against the production database — 125/125 uploaded,
      all `screenshots.url` rows now absolute, served with `cache-control: max-age=31536000`

#### 6d — Frontend Migration

- [x] Replace `games.json` import with `fetch('/api/games/random')` in game state
- [x] Update score submission to `POST /api/scores`
- [x] Keep local storage leaderboard as fallback, add global leaderboard tab
- [x] Ensure all existing features work identically

#### 6e — Deployment

- [x] Add Vercel adapter (`@sveltejs/adapter-vercel`)
- [x] Configure environment variables (Turso URL, Turso auth token, R2 credentials)
- [x] Deploy to Vercel
- [x] Verify production build

---

## Sprint 7 - Admin Panel

> Goal: Web-based admin interface for managing games and screenshots

### Ground Rules Carried Over From Sprint 6

Everything the admin panel needs on the infrastructure side already exists — these are the
constraints it has to work within.

**Blob uploads.** Store `geekster-screenshots` (`store_INcAJWeUsvrWGj0t`, region fra1,
**public** access). `BLOB_READ_WRITE_TOKEN` is set in Vercel for Development, Preview and
Production, so a server-side upload from an admin route works without further setup. Match the
convention `scripts/migrate-screenshots-to-blob.js` uses, or the two will drift:

```ts
put(`screenshots/${slug}.webp`, file, {
	access: 'public', // required — the store is public and cannot be switched later
	addRandomSuffix: false, // the slug IS the identity; a suffix breaks re-uploads
	allowOverwrite: true, // replacing a screenshot keeps the same pathname
	contentType: 'image/webp',
	cacheControlMaxAge: 31536000
});
```

**The database is the single source of truth — decided.** A SvelteKit API route runs as a Vercel
serverless function with a read-only filesystem, so anything created in the admin panel can never
reach `games.json`. That settles ownership: the database holds the real data, `games.json` is
demoted to seed data for a fresh or local environment — a test-data generator, nothing more.

Two consequences, both to be handled in 7a before any admin feature exists:

- **The runtime fallback goes away.** `fetchGames()` currently swallows an API error and serves the
  bundled JSON, which would quietly hide a broken database and serve a stale catalogue. If the
  service is unavailable, there is no game — show the error, let the player retry.
- **`db:seed` must stop deleting.** Today it runs `DELETE FROM screenshots` / `DELETE FROM games`
  and rebuilds from the JSON. Against a database that holds admin-entered games, that is silent
  data loss. It also reassigns every ID: SQLite `AUTOINCREMENT` never reuses a value after a
  `DELETE`, so re-seeding today's 125 games renumbers them from 126 upward and breaks every
  `/admin/games/<id>` link. Verified, not assumed.

**Schema changes need real migrations.** ~~There is no `drizzle/` directory~~ — resolved in
Sprint 7h-a: `drizzle/` now holds the baseline, all three databases are stamped, and `db:push` is
gone. Any new table or column goes through `npm run db:generate` + `npm run db:migrate`.

**Env vars are a manual step.** Claude Code is blocked from writing Vercel environment variables
(the harness classifies it as a secret-store write). `ADMIN_PASSWORD` or any other new secret has
to be added by hand in the Vercel dashboard, for each environment, and mirrored into the local
`.env`. Note that `TURSO_*` is currently set for Preview and Production only — not Development.

**Where it lives.** <https://geekster.pro/admin> — `www` 308-redirects to the apex.

### User Stories

- [x] US-7.1: As an admin, I can log in to a protected admin area
- [x] US-7.2: As an admin, I can view all games in a sortable/filterable table
- [x] US-7.3: As an admin, I can add a new game (name, year) and upload screenshots
- [x] US-7.4: As an admin, I can edit a game's details and manage its screenshots
- [x] US-7.5: As an admin, I can delete a game
- [x] US-7.6: As an admin, I can assign difficulty levels to individual screenshots
- [x] US-7.7: As an admin, I can fetch screenshot candidates from RAWG API and pick the best one
- [x] US-7.8: As a player, if the game data cannot be loaded, I see a clear error and can retry
      instead of silently playing an outdated catalogue

### Tech Tasks

#### 7a — Data Ownership (before any admin feature)

- [x] Remove the `games.json` fallback from `fetchGames()` in `src/lib/game.svelte.ts`
- [x] Surface the failure: add an error field to `GameState`, keep the phase on `welcome`, show the
      message on `WelcomeScreen.svelte` with the start button as the retry
- [x] Add the EN/DE strings for it to `i18n.svelte.ts`
- [x] Drop the "frontend falls back to static JSON" comment in `src/routes/api/games/random/+server.ts`
- [x] Rework `scripts/seed-database.js` into a real seeder: upsert by `slug` (insert missing games,
      update `name`/`year`, never delete), leave `screenshots.url` untouched when it already holds an
      absolute URL, and refuse to run against a non-empty database without `--force`
- [x] Note in `games.json` that it is seed data, not the live catalogue

> JSON cannot carry a comment, so the note lives in `src/lib/data/README.md` next to the file
> rather than inside it. `games.json` itself stays a plain array — five scripts parse it.
>
> `GameState.error` holds a _translation key_, not a message. `i18n.svelte.ts` gained `tk(key)`
> for looking a key up at runtime; it returns the key unchanged when it is unknown.

#### 7b — Auth & Layout

- [x] Admin auth middleware (check password/token from env var)
- [x] Admin layout with sidebar navigation (`/admin`)
- [x] Protected route group (`src/routes/admin/`)

#### 7c — Game Management

- [x] `/admin/games` — game list with search, sort by name/year
- [x] `/admin/games/new` — add game form with screenshot upload
- [x] `/admin/games/[id]` — edit game, manage screenshots
- [x] Delete game with confirmation
- [x] Bulk import from CSV/JSON

#### 7d — Screenshot Management

- [x] Upload screenshots directly to blob storage from admin
- [x] RAWG integration: search game, preview screenshots, one-click import
- [x] Set difficulty per screenshot (easy/medium/hard)
- [x] Set primary screenshot flag
- [x] Image preview and downscale on upload — crop deferred to a later sprint

#### 7e — Dashboard

- [x] `/admin` — overview: total games, total scores, recent activity
- [x] Quick-add game form on dashboard

### What Sprint 7 Actually Built

**Auth.** `ADMIN_PASSWORD` is the whole mechanism: `src/lib/server/auth.ts` compares it in
constant time and signs a `<expiry>.<hmac>` session cookie with the password as the HMAC key, so
changing the password in the Vercel dashboard logs every session out. Sessions last 12 hours.
`src/hooks.server.ts` sets `locals.admin`, redirects `/admin/**` to `/admin/login` and answers
`/api/admin/**` with 401. **When `ADMIN_PASSWORD` is unset the admin area is closed, not open** —
the login page says so instead of failing silently. There is no rate limiting: a Vercel function
has no shared memory to count attempts in, so the password has to carry that weight on its own.

**Blob uploads.** `@vercel/blob` reads `process.env` directly, which under `vite dev` does not
carry `.env` — so `src/lib/server/blob.ts` passes `token` explicitly on every `put`/`del`. The
upload convention matches `scripts/migrate-screenshots-to-blob.js`; a game's second and later
screenshots land under `screenshots/<slug>-2.webp`, `-3` and so on. Deleting a game or a
screenshot also deletes the blob; local `/screenshots/...` paths from the seed data are left
alone because those files live in the repository.

**Images.** `ScreenshotUpload.svelte` re-encodes the selection to WebP in the browser and scales
the longest edge to 1600px before the form is sent, so the store never receives a 6 MB PNG. It
degrades to a plain upload without JS. A crop UI was not built.

**RAWG.** `RAWG_API_KEY` is optional; without it the import panel says so and everything else
works. `fetchRawgImage()` refuses any URL that is not on `rawg.io` — the image URL comes from the
browser, so it is untrusted input and could otherwise be pointed at an internal address.

**The admin UI is English-only** — it is a single-operator tool and the EN/DE machinery would
double every string for no one's benefit.

**Environment variables, as of 2026-09-19.** `ADMIN_PASSWORD` is set for **Production** (via
`vercel env add`, which does work from here — the earlier note that Claude Code cannot write Vercel
env vars applies to the REST API path, where reading the CLI's stored auth token is blocked).
**Preview has none**, because `vercel env add <name> preview` insists on a git-branch answer that
the CLI will not accept non-interactively; add it in the dashboard if the admin panel should work
on preview deployments. `RAWG_API_KEY` is set for **Production** as well, so the RAWG picker is
live; the whole path was verified end to end (search → one-click import → blob URL served → delete
removes row and blob).

One asymmetry worth knowing: a browser upload is re-encoded to WebP at 1600px before it is sent,
but a RAWG import is stored as RAWG serves it — usually a full-size JPEG — because there is no
image library at runtime (`sharp` is a devDependency and Vercel would not install it).

**Secrets are write-only.** `ADMIN_PASSWORD`, `RAWG_API_KEY` and both `TURSO_AUTH_TOKEN` entries
were converted to Vercel's `sensitive` type, so nothing — dashboard, REST API, CLI or an agent —
can read them back. The readable copies live only in the local `.env`. Changing an env var does not
reach the running deployment either: Vercel binds them at build time, so a redeploy is part of any
secret rotation.

**Two stages, not three.** Vercel's `Development` environment cannot be deleted, so it is left
unpopulated: local work runs `npm run dev` against the repo's `.env`, never `vercel dev`. That
`.env` points `TURSO_DATABASE_URL` at `file:local.db` — with an admin panel that deletes games and
blob files, a local session must not be able to reach production. The live credentials sit in the
file commented out. Note the asymmetry: there is only one blob store, so a local upload still
writes to the live store.

---

## Sprint 7f - Admin Usability Pass

> Goal: Make the admin panel pleasant to work in after a real session of using it

### Tech Tasks

- [x] Games list: the whole row opens the game, with a pointer cursor on hover
- [x] Detail page: prev/next chevrons that walk the list's own order and filter
- [x] Delete confirms in a modal dialog instead of inline buttons (list and detail page)
- [x] Sidebar: only the deepest matching link is highlighted
- [x] Games without a screenshot are flagged in the list and on the detail page
- [x] Screenshot lightbox from the list thumbnail and the detail page thumbnail
- [x] Loading state for the RAWG search and for a RAWG import (which also blocks a second click)
- [x] Search runs itself after 3 characters with a 300 ms debounce; the Search button is gone

### Decisions

**A game without a screenshot was already invisible.** `/api/games` and `/api/games/random`
inner-join `screenshots` on `is_primary = 1`, so such a game never enters a round — the gap was
that nothing said so in the admin panel. Blocking creation until a screenshot exists was rejected:
the normal flow is create the game, then pull a RAWG shot on the detail page it redirects to.
Instead the list carries a red `NO SCREENSHOT` badge and a warning thumbnail per row, a banner
with the total across the whole table (not just the current filter), and a `?missing=1` filter to
work through them. The detail page repeats the warning above the form.

**Multiple screenshots per game are fine.** `addScreenshot()` marks a screenshot primary only when
the game has none, and the game serves the primary alone — extras are alternates waiting for the
Sprint 8 difficulty system. What was not fine was importing the same one twice because the first
click gave no feedback: an import now disables every candidate tile and puts a spinner on the one
being fetched.

**`bits-ui` for the modals.** Headless, Svelte 5 native (it is what shadcn-svelte is built on) and
styled with the panel's existing Tailwind classes, so nothing about the look changes. A full kit
(Skeleton, Flowbite) would have brought its own theme for two dialogs. It is a `dependency`, not a
devDependency — the components ship in the admin bundle.

**The list state lives in the URL.** `src/lib/adminList.ts` parses and serialises
`?q=&sort=&dir=&missing=`, the row link carries it to `/admin/games/[id]`, and
`getGameNeighbours()` re-runs the same order and filter server-side to find prev/next. Adding a
screenshot while the `missing=1` filter is on drops the game out of that set, which would strand
the chevrons — the load falls back to the unfiltered order when the game is no longer in it.

**Row clicks keep the name link.** The `<tr>` gets an `onclick` that ignores events originating on
a link, button, input or select. The name cell stays a real `<a>`, so keyboard and middle-click
still work and no ARIA role has to lie about what a table row is.

---

## Sprint 7g - CI/CD & Staging

> Goal: A branch that deploys somewhere safe, and a gate that runs before anything merges

### What existed before

Vercel's Git integration and nothing else. Push to `main` built Production, any other branch got
a throwaway preview URL, and no lint or type-check ran anywhere but on the developer's machine.
`.github/workflows/deploy.yml` had existed for GitHub Pages and was deleted in Sprint 6, so there
was no workflow directory at all. `main` had no branch protection: a direct push shipped to
geekster.pro.

Preview already had `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` set, pointing at the **production**
database — the only one that existed. A staging deployment would have read and written live data.

### Tech Tasks

- [x] `.github/workflows/ci.yml` — lint, format:check, svelte-check and build on PRs and on
      pushes to `main` and `develop`
- [x] `develop` branch, deployed to `staging.geekster.pro`
- [x] Project domain `staging.geekster.pro` pinned to the `develop` branch, CNAME at IONOS
- [x] Branch protection on `main`: PR required, CI required, no force pushes
- [x] `X-Robots-Tag: noindex, nofollow` outside production
- [x] `staging/` blob pathname prefix outside production
- [x] Separate Turso database for staging, and the Preview env vars repointed at it
- [x] `ADMIN_PASSWORD` for Preview — only after the database is split

### Decisions

**Everything fits on the free tiers.** Vercel Hobby allows 100 Blob stores and bills storage by
usage against a shared 1 GB; Turso's free plan allows 100 databases and 5 GB; GitHub Actions and
branch protection are free on a public repository. Nothing here needs Pro.

**Staging is a pinned preview, not a third environment.** Vercel Custom Environments are a Pro
feature, so the Hobby plan has exactly one Preview environment. `staging.geekster.pro` is a
project domain with `gitBranch: develop`, which gives the `develop` branch a stable URL while
still building as a preview. The consequence to remember: **every variable set for Preview also
applies to every feature-branch preview.** There is no way to give staging its own secrets
without Pro.

**CI does not deploy.** Routing deploys through Actions would mean storing a `VERCEL_TOKEN` in
GitHub and reimplementing what the Git integration already does. The workflow only gates. It also
needs no secrets, because `src/lib/server/db.ts` is lazy and reads `$env/dynamic/private` at
request time — a production build never touches the database.

**One blob store, prefixed paths.** `uploadScreenshot()` deliberately reuses the pathname
`screenshots/<slug>.webp` so that replacing a screenshot keeps the URL. With one store shared by
all stages, a staging upload of an existing slug would silently overwrite the production image.
`src/lib/server/blob.ts` now writes everything outside production under `staging/`. A second store
would also have been free, but it means a second `BLOB_READ_WRITE_TOKEN` to place per environment
and a live production variable to edit; the prefix is one line and cannot break production.

**Staging turned out to be protected, which was not the assumption.** The project's deployment
protection reads `all_except_custom_domains`, and that was taken to mean any custom domain — so
`staging.geekster.pro` was expected to be public. It is not: the exemption covers only the
**production** custom domain. A domain pinned to a branch still resolves to a preview deployment,
and preview deployments stay behind Vercel Authentication. Measured after the first staging
deploy:

```
https://geekster.pro/          → 200
https://staging.geekster.pro/  → 302 https://vercel.com/sso-api?url=…
```

The `X-Robots-Tag: noindex, nofollow` header in `src/hooks.server.ts` stays anyway. It costs
nothing, it covers the generated `*.vercel.app` URLs as well, and it is what keeps a second copy
of the game out of the search index if the protection is ever relaxed. It also means
`ADMIN_PASSWORD` on Preview sits behind two locks rather than one: the Vercel login first, the
admin password second.

### Facts that live nowhere else

- **IONOS zone `geekster.pro`** is `4daec29a-2b76-11f1-ab4c-0a58644404d8`. `staging` is an
  **A record to `76.76.21.21`**, matching the apex and `www` — Vercel documents a CNAME to
  `cname.vercel-dns-0.com` for subdomains, but the A record is what this zone already proves
  works. Record id `7815e8f2-1556-1fc3-489c-2f03cf47cb08`, TTL 3600
- The Vercel project domain carries `gitBranch: develop`; it verified immediately because the
  apex is already in the account
- **Vercel does not redeploy a commit it has already built.** `develop` was created by pushing
  `main` to a new ref, so no staging deployment exists until `develop` advances by one commit
- `main` is protected with classic branch protection: PR required (0 approvals — solo repo),
  the `Lint, check and build` check required, force pushes and deletions refused. `enforce_admins`
  is **off** on purpose, so the owner can still push directly in an emergency
- **Turso org `kaiserlike`** (personal, plan `starter`), group `default`, region `aws-eu-west-1`.
  Staging database `geekster-staging`, host
  `libsql://geekster-staging-kaiserlike.aws-eu-west-1.turso.io`. Its auth token was minted with
  `expiration=never` and `authorization=full-access`, and sits commented out in the local `.env`
  next to the production pair
- **`vercel env add <name> preview` is broken in the CLI.** It answers
  `{"status":"action_required","reason":"git_branch_required"}` and then rejects the very command
  it prints in `next[]` (`--value … --yes`), looping forever. The production target works. Preview
  variables therefore have to go through the REST API, the Vercel MCP server or the dashboard
- The Turso **platform** API token lives in `.env` as `TURSO_API_TOKEN`. It can create and delete
  every database in the account, so revoke it at app.turso.tech when it is no longer needed

### How the staging database was built

There is no Turso CLI on this machine, and installing it through Homebrew would have meant
trusting two third-party taps. The **platform REST API** does the same work over curl with a
token from app.turso.tech → Account Settings → API Tokens:

```bash
curl -H "Authorization: Bearer $TURSO_API_TOKEN" \
     https://api.turso.tech/v1/organizations                       # → slug, plan
curl -X POST -H "Authorization: Bearer $TURSO_API_TOKEN" -H 'Content-Type: application/json' \
     -d '{"name":"geekster-staging","group":"default"}' \
     https://api.turso.tech/v1/organizations/kaiserlike/databases
curl -X POST -H "Authorization: Bearer $TURSO_API_TOKEN" \
     'https://api.turso.tech/v1/organizations/kaiserlike/databases/geekster-staging/auth/tokens?expiration=never&authorization=full-access'
```

**Staging is seeded from `games.json`, not copied from production — deliberately.** A copy would
carry production's absolute Vercel Blob URLs, and `deleteScreenshotBlob()` deletes any URL on the
blob host. Deleting a game in the staging admin panel would then remove the production image.
Seeding from the JSON gives 125 rows whose `screenshots.url` are local `/screenshots/…` paths,
which the deleter ignores by design and which the deployment serves from `static/`. Verified after
seeding: 125 games, 125 screenshots, **0 absolute URLs**.

`npm run blob:migrate` must therefore **never** be run against the staging database.

### Done — the state at the end of the sprint

`ADMIN_PASSWORD` for Preview was the last step on purpose: before the database split it would
have put a fully working, delete-capable admin panel onto live data. It is set now, with a
password of its own, so the staging admin sits behind two locks — the Vercel login first, the
admin password second.

Verified after the first release through the pipeline (`main` @ the PR #3 merge):

| Check                                   | Result                                  |
| --------------------------------------- | --------------------------------------- |
| `https://geekster.pro/`                 | 200, no `X-Robots-Tag`                  |
| `https://geekster.pro/api/games/random` | 200, screenshots served from blob URLs  |
| `https://staging.geekster.pro/`         | 302 → `vercel.com/sso-api` (not public) |
| CI on `develop` and on the release PR   | green                                   |
| Turso `geekster-staging`                | 125 games, 125 screenshots, 0 blob URLs |

`main` and `develop` are kept identical after a release — the release merge commit is pushed
back to `develop`, so the next feature branch starts from the released tree. The merged
`feature/*` and `chore/*` branches are deleted; `github-pages` is deliberately kept, since it
still holds the retired GitHub Pages deployment.

### What this sprint did not solve

**There are still no migrations.** `drizzle/` does not exist: the schema was created by raw
`CREATE TABLE IF NOT EXISTS` statements inside `scripts/seed-database.js` plus a manual
`npm run db:push`. That was survivable with one database; there are now two. Planned out as
**Sprint 7h**, together with the one-way staging refresh and the backup script. _Closed by
Sprint 7h-a._

---

## Sprint 7h - Schema Migrations & Environment Hygiene

> Goal: A schema that can be changed safely across two databases, and a staging environment that
> can be refreshed from production without touching a single image

### The question this sprint answers

Two databases exist now. The obvious wish is to "migrate staging to production and back". That
wish hides two problems with opposite correct answers, and keeping them apart is the whole
design:

| Concern                 | Direction                         | How                                    |
| ----------------------- | --------------------------------- | -------------------------------------- |
| **Schema** (DDL)        | code → staging → production       | Versioned Drizzle migrations, in order |
| **Data** (rows, images) | production → staging, **one way** | A refresh script that replaces staging |

### Decision: there is no staging → production data sync

Rejected deliberately, not for lack of time:

- **IDs.** Both databases use `AUTOINCREMENT`. Merging two sets that have both grown means either
  collisions or renumbering, and renumbering breaks every `/admin/games/<id>` link.
- **A merge needs a human.** `slug` is unique, so an upsert by slug is possible — `db:seed`
  already does one. But "sync both ways" is not an upsert, it is a merge, and a merge needs
  conflict rules: same slug with a different year, who wins? Deleted in production but present in
  staging, resurrect or not? No script can answer that; it has to be decided per row.
- **Images would gain a second source of truth.** Promoting a staging screenshot means copying the
  blob, minting a new URL and rewriting the row — a second place where an image can be "the real
  one".
- **And it is not needed.** Content is authored in production. A game without a primary screenshot
  is already invisible to players (both game APIs inner-join it) and is flagged in the admin list,
  so work in progress can be staged _inside_ production. That is a content workflow, not an
  environment one.

If a real need to promote staging content ever appears, it is an upsert by slug plus
`copy()` from `@vercel/blob` — roughly sixty lines, to be written against a concrete case rather
than in advance.

### Tech Tasks

#### 7h-a — Baseline the schema — **done**

- [x] `npm run db:generate` to produce `drizzle/0000_baseline.sql` from `src/lib/server/schema.ts`
      (renamed from drizzle's random tag, journal updated to match)
- [x] **Stamp the databases as already migrated** instead of running it — the tables exist, and
      drizzle generates plain `CREATE TABLE`, so a naive `db:migrate` fails on the first
      statement. `scripts/stamp-migrations.js` (`npm run db:stamp -- --target=<stage>`) writes the
      row into `__drizzle_migrations`, verified with a no-op `db:migrate`
- [x] Commit `drizzle/` and its journal; retire `db:push` from the documented workflow — the
      script is **removed from `package.json`**, not merely undocumented

##### The baseline was not empty after all

The sprint assumed the generated diff would be empty. It was not, and the difference was a real
bug rather than cosmetic drift:

`schema.ts` had `createdAt: text('created_at').default('CURRENT_TIMESTAMP')` — a JavaScript
string. Drizzle emits that as a **quoted literal**, `DEFAULT 'CURRENT_TIMESTAMP'`, so any database
built from the migration stores the eleven characters `CURRENT_TIMESTAMP` in `created_at` instead
of a time, and `new Date(score.createdAt)` in `Leaderboard.svelte` renders `Invalid Date`. The
three live databases were fine only because the raw DDL in `seed-database.js` used the SQL
keyword. Baselining as-generated would have frozen a schema that does not describe any database
that exists.

Fixed to ``.default(sql`CURRENT_TIMESTAMP`)`` and the baseline regenerated **before** anything was
stamped, so the committed `0000_baseline.sql` matches the live tables. Confirmed end to end: a
fresh `db:migrate` into an empty file now stores `2026-09-20 15:32:16`.

##### Two other things had to change for migrations to work at all

- **`drizzle.config.ts` could never migrate its own local fallback.** The `turso` dialect
  validates `authToken` as a required non-empty string, so `db:migrate` against `file:local.db`
  died with `[x] authToken: ''`. @libsql/client never sends the token for a `file:` URL, so the
  config now supplies a placeholder for that case
- **`seed-database.js` no longer creates tables.** Its `CREATE TABLE IF NOT EXISTS` block is the
  other half of how the databases drifted: tables made that way get no `__drizzle_migrations` row,
  so the next `db:migrate` would try to `CREATE TABLE` on top of them and fail. It now checks the
  tables exist and points at `db:migrate`. A fresh environment is `db:migrate` then `db:seed`

##### What stamping the live databases revealed

Production and staging **do not have the same schema**, and neither exactly matches the baseline.
The two were built by different means and nobody had compared them:

|                      | production                              | staging                                      | committed baseline              |
| -------------------- | --------------------------------------- | -------------------------------------------- | ------------------------------- |
| built by             | `db:push` (old `schema.ts`)             | raw DDL in `seed-database.js`                | —                               |
| `created_at` default | `DEFAULT 'CURRENT_TIMESTAMP'` — the bug | `DEFAULT CURRENT_TIMESTAMP`                  | `DEFAULT CURRENT_TIMESTAMP`     |
| `slug` uniqueness    | named index `games_slug_unique`         | inline `UNIQUE` → `sqlite_autoindex_games_1` | named index `games_slug_unique` |

**The `created_at` bug is live in production.** All 127 games and all 127 screenshots hold the
eleven-character string `CURRENT_TIMESTAMP` in `created_at`, not a time — production was pushed
from the schema before the fix. `scores` is empty, so the `Invalid Date` in `Leaderboard.svelte`
has not been seen by a player yet; it would appear on the first score written. Staging is clean
because raw DDL made its tables.

Both databases are stamped anyway, and that is the right call: the next migration is
`ALTER TABLE games ADD COLUMN published INTEGER DEFAULT 1` (7i-a), which applies identically
whatever the `created_at` default is. The stamp unblocks 7i-a exactly as intended.

**Still open:** converging production onto the baseline needs a hand-written corrective migration.
SQLite cannot `ALTER` a column default, so it is the twelve-step table rebuild — new table, copy,
drop, rename — plus a backfill of the 254 literal values. That is a destructive operation on
production and **7h-d (`db:dump`) does not exist yet**, so it was deliberately not done here. Do
`db:dump` first. Until then the drift is recorded rather than fixed, and it is invisible to
`db:generate`, which diffs against `meta/0000_snapshot.json` and not against a live database.

##### How the stamp is known to be correct

`drizzle-kit migrate` on the `turso` dialect delegates to `drizzle-orm/libsql/migrator`, which
records `sha256` of the whole `.sql` file plus the journal's `when` as `created_at`, and skips any
migration whose `when` is not newer than the newest `created_at` present. `db:stamp` writes
exactly that row. Verified by running a real `db:migrate` into an empty database and comparing:
the hash it recorded is byte-for-byte the one the stamp writes.

Guards on `db:stamp`: it refuses a database where the migration's tables are missing (that wants a
real migrate, not a stamp), it is idempotent, it only touches journal entry 0 unless `--tag=` is
passed, and `--target=production` refuses to run while `TURSO_DATABASE_URL` still points at a
`file:` URL.

#### 7h-b — The migration runbook — **done**

- [x] Written as **`.claude/docs/schema-migrations.md`**, with the short version in `README.md`
      § Schema changes and the rules in `CLAUDE.md` § Schema Migrations: `db:generate` on the
      feature branch, the SQL file read and committed like code, `db:migrate` against **staging**
      when the branch reaches `develop`, `db:migrate` against **production** at release
- [x] Migrations run from a laptop, **not** from CI. CI would need production credentials in
      GitHub secrets, and a migration that fails halfway through a deploy has no rollback
- [x] `db:migrate` can target a stage by name, so the runbook has no step that depends on
      remembering to undo something — see below
- [x] Expand/contract adopted, with the three-release rename table. 7i-a's
      `games.published INTEGER DEFAULT 1` is the safe single-release case: the default means every
      existing row and all the old code keep behaving exactly as before

The runbook also records what 7h-a learned the hard way: read the generated SQL (a default written
as a JavaScript string becomes a quoted literal), never edit or reformat an applied migration
(`drizzle/` is in `.prettierignore` because the `.sql` bytes are hashed), and prove a migration by
deleting `local.db` and rebuilding from scratch rather than only ever applying it on top of an
existing database.

##### `db:migrate` now targets a stage by name — done in the same sprint

The runbook's own most dangerous step, closed rather than left written down. Applying a migration
used to mean uncommenting the live credentials in `.env`, and **while they were uncommented
`npm run dev` gave the local admin panel full delete rights over production games and their
blobs**. The runbook said to re-comment in the same sitting, which is a procedure where a guard
belongs.

- [x] `scripts/db-target.js` — one resolver, shared by `drizzle.config.ts` and
      `stamp-migrations.js`, so every tool names a stage the same way and gets the same guards
- [x] `npm run db:migrate:staging` / `db:migrate:production`, via a `DB_TARGET` variable the
      config reads. A bare `db:migrate` still means local
- [x] `TURSO_STAGING_*` and `TURSO_PRODUCTION_*` added to `.env` and `.env.example`. The
      application reads neither: `src/lib/server/db.ts` uses `TURSO_DATABASE_URL` alone, which
      stays at `file:local.db` permanently. Verified — nothing in `src/` mentions the new names,
      and they are set only locally, never on Vercel
- [x] Every non-local run prints the stage and host it resolved before touching anything

`resolveTarget()` refuses rather than guesses, and each refusal was tested: an unrecognised stage;
a `TURSO_STAGING_*` / `TURSO_PRODUCTION_*` variable that is not set; a production URL that is a
`file:` path; a production URL containing `staging`; a staging URL identical to the production one
— the copy-paste that would aim a staging run at production.

> Worth knowing when testing a guard from the shell: `scripts/load-env.js` treats an **empty**
> environment variable as unset and fills it from `.env`, so `VAR= npm run ...` does not blank it.

All three targets verified end to end against the live databases, `.env` never edited: local,
staging and production each a no-op `db:migrate`, and `db:stamp` reporting "Already stamped" for
all three.

#### 7h-c — `npm run db:refresh-staging` — **done**

- [x] One-way production → staging: replaces `games` and `screenshots`, skips `scores`
- [x] Copies `screenshots.url` **verbatim**, production blob URLs included. No image is copied:
      the store is public, and the Sprint 7g delete guard means staging cannot delete them
- [x] `--dry-run` prints the plan; the stage comes from `scripts/db-target.js` rather than a
      `--force` flag, which is a stronger version of the guard the sprint asked for — production
      and staging are named separately and the resolver refuses if they resolve to the same
      database. The script checks that again itself, being the one that empties a table
- [x] Reverses the Sprint 7g decision to seed staging from `games.json`
- [x] Dumps staging first unless `--no-backup` is passed, and aborts if that dump fails
- [x] **Copies only the columns both databases have.** Staging is migrated ahead of production by
      design, so it can hold a column production does not — `games.published` right now. The
      missing ones fall back to staging's own defaults. Without this the refresh would break every
      time a migration was applied to staging and not yet to production, which is most of the time

##### How it was tested before it was run

The first attempt to run it was blocked by the coding environment's safety classifier, which reads
the script's `DELETE FROM games` as a mass delete. That is a fair reading — it is one.

Rather than work around it, the copy logic was split out of the CLI (`planRefresh()`,
`copyRows()`) and exercised against two local SQLite files standing in for the two stages, with
'production' deliberately lacking `published` to reproduce the real difference:

| Check                      | Result                                                          |
| -------------------------- | --------------------------------------------------------------- |
| column intersection        | `id,name,slug,year,created_at`; `published` reported as skipped |
| stale staging row          | gone                                                            |
| IDs                        | preserved verbatim — 7 and 9, not renumbered                    |
| blob URLs                  | copied unchanged                                                |
| `published` on copied rows | `1`, from staging's own default                                 |
| `scores`                   | untouched, the pre-existing row survived                        |

The dry run **was** exercised against the live pair, since it only reads: 126 → 127 games,
125 → 127 screenshots, 0 scores, `published` correctly flagged as production-side missing.

**It has since been run.** Staging went from 126 games / 125 local screenshot paths to
production's 127 games / 127 blob URLs, and now mirrors production.

```bash
npm run db:refresh-staging -- --dry-run   # read it first
npm run db:refresh-staging                # takes a backup, then replaces
```

#### 7h-d — Backups — **done**

> Built ahead of its customer: the corrective migration for production's `created_at` default
> (see 7h-a) is a table rebuild, and should not run before `db:dump` exists.

- [x] `npm run db:dump -- --target=local|staging|production [--out=<dir>]` — timestamped JSON into
      `backups/`, which is gitignored. It dumps **every** table rather than only `games` and
      `screenshots`: `scores` is player data that nothing else holds a copy of, and
      `__drizzle_migrations` lets a restored copy be told which migrations it has already had
- [x] Turso's free plan keeps **one day** of point-in-time restore. That is the real safety net,
      and one day is short enough that a dump before a risky operation is worth the two seconds
- [x] A table that does not exist is reported, not fatal — a fresh database has no
      `__drizzle_migrations` until something has been migrated or stamped

**There is deliberately no `db:restore`.** A script that writes rows back into a database is the
kind of thing that should be read and thought about at the moment it is needed, not trusted from a
previous sprint. The dump is flat JSON whose row objects are keyed by column name, so they feed
straight back as named parameters; `.claude/docs/schema-migrations.md` § Backups shows the loop and
notes that `games` restores before `screenshots`, because the foreign key runs that way.

A production dump was taken while building this, which is now the pre-rebuild backup the
`created_at` corrective needs. It confirms the drift from the database rather than from a query:
**127 of 127 games** carry the literal string `CURRENT_TIMESTAMP`.

### Notes for whoever picks this up

- ~~**Sprint 8 needs no schema change.**~~ **Superseded 2026-09-26:** Sprint 8 was re-planned as
  Normal / Pro with a crop tool, and it needs migration `0003` (see Sprint 8). What was true then:
  `screenshots.difficulty` and `scores.difficulty` already exist, and the difficulty system reads them. So the baseline in 7h-a can be done while the
  generated diff is empty, which is exactly when it is cheapest and least risky
- The delete guard is already in place: `ownsBlob()` in `src/lib/server/blob.ts` refuses any blob
  whose pathname belongs to another stage, in both directions. Verified end to end against the
  live store — deleting as production refused a `staging/` blob and logged it, deleting as staging
  removed it
- A deleted blob can still answer 200 from the CDN for a long time, because uploads set
  `cacheControlMaxAge` to a year. `list({ prefix })` is the authoritative check

---

## Sprint 7i - Draft Mode, One Image Pipeline & Curation

> Goal: Nothing reaches players until it has been reviewed, and every screenshot in the store is
> a WebP

### Why

Two gaps found while planning how new games would actually get added.

**There is no state where a finished game is hidden.** The only thing that hides a game today is
an accident of the schema: `/api/games` and `/api/games/random` inner-join the primary screenshot,
so a game without one is invisible. That means the moment a screenshot is added for review, the
game is live — the review step has nowhere to happen. It also means "ready for review" and
"broken" look identical in the admin list; both carry the red `NO SCREENSHOT` flag.

**Half the screenshots are not WebP.** `ScreenshotUpload.svelte` re-encodes to WebP and scales the
longest edge to 1600px, but that runs in the **browser**, on the file-picker path only. A RAWG
import is a server-side fetch that stores the bytes exactly as RAWG served them — a full-size
JPEG, roughly 200–500 kB against ~40 kB for the WebP. Every screenshot pulled from the RAWG picker
so far is uncompressed. This is not a storage problem (nowhere near the 1 GB Hobby allowance), it
is page weight in the game.

### Tech Tasks

#### 7i-a — Draft mode (the first real migration) — **done**

- [x] `games.published INTEGER DEFAULT 1` in `src/lib/server/schema.ts`. Default `1` so the
      existing rows, `db:seed` and the bulk import keep behaving exactly as they did
- [x] `npm run db:generate` → `drizzle/0001_games_published.sql`, renamed from drizzle's random
      tag, read, committed, applied with the 7h-b runbook: staging first, production at the
      release (PR #19) — the runbook's order, not an oversight
- [x] `eq(games.published, 1)` in `/api/games` and `/api/games/random`. The live rule is now
      **published AND has a primary screenshot**
- [x] "Create as draft" on `/admin/games/new`, on the dashboard quick-add **and on the bulk
      import**, ticked by default. The import was not in the original list, but 7i-d is a bulk add
      that has to land as drafts, and an opt-in box changes no existing default
- [x] Publish / Unpublish on the game detail page, with a panel that says which state the game is
      in and why it is or is not reachable by players
- [x] An amber `DRAFT` badge, deliberately unlike the red `NO SCREENSHOT` one. A game can carry
      both; they mean different things and must not look alike
- [x] `?status=all|draft|published` next to `?missing=1`, as filter chips carrying the draft count,
      and a Drafts tile on the dashboard

##### Details worth keeping

- **The generated SQL was a plain `ALTER TABLE games ADD published integer DEFAULT 1`** — no table
  rebuild, which is what made this the right migration to put through the pipeline first. SQLite
  backfills the default, so all 125 local and 126 staging rows came out `published = 1`
- **The publish button submits the state it wants, not a toggle**, so a double submit cannot flip a
  game back to where it started
- **The detail page's prev/next fallback now covers `status` as well as `missing`.** Acting on a
  game can drop it out of the filter it was reached through — adding a screenshot leaves a
  "missing" list, publishing leaves a "draft" one — and either would stranded prev/next
- **A failed quick-add or import returns the draft choice with the error**, so the checkbox keeps
  what was chosen rather than silently resetting to the default

##### Verified against a running app

`npm run dev`, a real admin session, and the local database:

| Check                                      | Result                                                  |
| ------------------------------------------ | ------------------------------------------------------- |
| unpublish a game **that has a screenshot** | `/api/games` 125 → 124, absent from `/api/games/random` |
| publish it again                           | back to 125                                             |
| `?status=draft` / `?status=published`      | show and hide exactly that game                         |
| quick-add with and without the box         | `published` 0 and 1                                     |
| bulk import with and without the box       | 0, 0 and 1                                              |
| `?/publish` action                         | state changed in the database, page shows the new panel |

Staging after `db:migrate:staging`: 126 rows all `published = 1`, two migration rows, second run a
no-op.

#### 7i-b — One image pipeline — **done**

Every image now takes the same path: fetched, re-encoded to WebP at 1600px in the browser,
uploaded through the one action.

- [x] `GET /api/admin/rawg/image?url=…` — admin-only proxy that server-fetches through
      `fetchRawgImage()` (which refuses any URL not on `rawg.io`) and streams the bytes back from
      our own origin. `Cache-Control: private, no-store`: the browser re-encodes them immediately
      and they must not outlive the admin session in a shared cache
- [x] The encoder is out of `ScreenshotUpload.svelte` and in `src/lib/imageEncode.ts` as
      `toWebp(source: Blob, options): Promise<File>`, shared by the file picker and the RAWG flow
- [x] Choosing a RAWG screenshot: fetch the proxy → `toWebp()` → POST to the existing `?/upload`
- [x] **`rawgImport` deleted.** One code path for every image is the point
- [x] The asymmetry paragraph is out of `CLAUDE.md`, because it is no longer true

##### Correction: the stated reason for the proxy was wrong

This sprint was planned on the claim that _"fetching the RAWG URL straight from the browser does
not work … it needs `Access-Control-Allow-Origin` from `media.rawg.io`. Without it the fetch fails
or the canvas is tainted."_

**That is not true.** Checked against the live host while building this:

```
$ curl -sI -H 'Origin: https://geekster.pro' https://media.rawg.io/media/screenshots/…jpg
HTTP/2 200
access-control-allow-origin: *
access-control-allow-methods: GET, HEAD
```

`media.rawg.io` sends `Access-Control-Allow-Origin: *`, so a direct `fetch()` would succeed and an
`<img crossorigin="anonymous">` would not taint the canvas. The proxy was **kept anyway**, on a
reason that does hold: that header is not part of any contract RAWG has with us, and if it ever
goes away the import breaks silently for an operator rather than loudly in CI. The cost is one
endpoint and one extra hop on an admin-only operation, which this sprint had already accepted.

If that trade is not wanted, dropping the proxy is a small change — delete the route and fetch the
`image` URL directly in `importRawgImage()`. It is recorded here rather than decided quietly.

##### Verified

| Check                           | Result                                                                   |
| ------------------------------- | ------------------------------------------------------------------------ |
| proxy unauthenticated           | 401 from the `/api/admin` guard                                          |
| proxy with a non-`rawg.io` host | 400, refused by `fetchRawgImage()`                                       |
| proxy with no `url`             | 400                                                                      |
| proxy with a real RAWG image    | 200, `image/jpeg`, **byte-for-byte identical** to fetching RAWG directly |
| `?/upload` with a WebP          | 200, row written, blob at `staging/screenshots/<slug>.webp`              |
| deleting that game              | row and blob both gone (`list({ prefix })`, the authoritative check)     |

The local upload landed under the `staging/` prefix rather than production, which incidentally
re-confirms the Sprint 7g stage guard.

#### 7i-c — Preview a RAWG screenshot before choosing it — **done**

- [x] `ImageLightbox.svelte` takes an optional `actions` snippet, rendered under the image. The
      existing callers (games list, detail page) pass nothing and are unchanged
- [x] A RAWG candidate thumbnail opens the lightbox at full size instead of importing immediately
- [x] "Use this screenshot" runs the 7i-b flow, keeping the disabled state and spinner — the
      operation is longer now (proxy fetch, encode, upload)
- [x] ← / → step between that candidate's shots without closing, as arrow buttons and arrow keys.
      Both are optional props: pass neither and no arrows render, which is why the two plain
      viewers did not change

An import failure is rendered **inside** the lightbox as well. `rawgError` is shown in the RAWG
section further up the page, which sits behind the open dialog — the operator would have clicked
and seen nothing happen.

#### 7i-e — The RAWG picker on the create form — **done**

Adding a game was two screens: create it, land on its page, then go looking for a screenshot.
7i-d is a bulk add, so that second lap is the cost that matters.

- [x] `src/lib/components/admin/RawgPicker.svelte` — the search, the candidate tiles, the preview
      lightbox with ← / →, the `/api/admin/rawg/image` proxy fetch and `toWebp()`, all in one
      place. It hands the caller a `File` and has no opinion about where it goes
- [x] The edit page uses it and loses ~100 lines; its callback POSTs to `?/upload` and
      `invalidateAll()`s, exactly as before
- [x] `/admin/games/new` uses it too. There is no game to attach an image to yet, so the chosen
      WebP is held in the browser and `use:enhance` sets it as the `screenshot` field of the
      create submission. **The server action did not change** — it already accepted a file
- [x] `ScreenshotUpload` grew `clear()` and an `onselect` callback, so the two pickers can clear
      each other
- [x] A screenshot failure on the create form redirects to the created game with
      `?warning=<code>` rather than returning to the form

##### Details worth keeping

- **The search cannot be a `<form>`.** On the create form the picker renders _inside_ the create
  form and nested forms are invalid HTML — the inner one silently does nothing. It is an input
  and a button, and the input swallows Enter so it searches instead of submitting the game
- **One field, so the pickers clear each other.** Both write the same `screenshot` entry; the
  last one used wins and only one preview is on screen. Without that, `takeFile() ?? rawgFile`
  would quietly upload a file the operator thought they had replaced
- **The warning is a code, not a message.** `?warning=screenshot-failed` is mapped to text in the
  edit page's `load`; an unknown code renders nothing. A message passed in the URL would be
  arbitrary text rendered on an admin page
- **The game is created before the screenshot, so a failure must not come back to the form.**
  Returning `fail()` left a real game behind an error that read like nothing had happened, and a
  second submit created it again under `-2`

##### Verified in a real browser

This project has no browser driver and still does not ship one. For this pass, headless Chromium
(the installed Brave, `--headless=new --remote-debugging-port`) was driven over the DevTools
protocol from a throwaway script, against `npm run dev`, the real RAWG API and the real blob
store. **Anything that clicks must wait for hydration** — the SSR markup is complete long before
the handlers are attached, and an early click is simply swallowed.

| Check                                 | Result                                                       |
| ------------------------------------- | ------------------------------------------------------------ |
| create form: search "Doom"            | 31 candidate thumbnails                                      |
| click a thumbnail                     | lightbox opens at `1 / 7`                                    |
| → arrow key                           | `2 / 7`                                                      |
| "Use for this game"                   | 250 kB JPEG → **110 kB WebP**, held, lightbox closes         |
| submit                                | game created as a **draft** with a primary screenshot        |
| edit page: the same flow              | screenshot count 1 → 2, uploaded straight away               |
| pick a file after choosing from RAWG  | the RAWG choice is dropped                                   |
| choose from RAWG after picking a file | the file input is cleared                                    |
| unsupported file type on create       | `303 /admin/games/134/?warning=screenshot-type`, game exists |
| `?warning=<script>alert(1)</script>`  | renders nothing                                              |

The three test games were deleted through the panel afterwards: 125 games / 125 screenshots, and
`list({ prefix: 'staging/screenshots/zzz' })` — the authoritative check — comes back empty.

#### 7i-d — How new games reach production

Decided while planning this sprint, so it does not get re-argued: **new games are added by driving
the admin panel over HTTP**, with the session cookie from a normal `ADMIN_PASSWORD` login, against
geekster.pro.

- Every game mutation is a SvelteKit **form action**, not a REST endpoint. There is no create or
  delete API to call. The guard in `src/hooks.server.ts` covers `/admin/**`, and SvelteKit's CSRF
  check rejects a POST without a matching `Origin` header
- **Not direct Turso writes.** That bypasses `uniqueSlug()`, the year bounds, the
  "exactly one primary screenshot" invariant and the blob pathname convention — every guarantee
  would have to be re-implemented in a script, and a mistake lands in production unchecked
- **Not `games.json` + `db:seed`.** `db:seed` inserts screenshots as local `/screenshots/…` paths,
  so the images would have to be committed to the repository — reversing the Sprint 7a decision
  that the database owns the data and the blob store owns the images
- ~~**Until 7i-b ships**, an image added this way has to be compressed first…~~ **Obsolete since
  7i-b.** There is no `rawgImport` action any more, and no need for `sharp`: the admin panel's own
  RAWG picker re-encodes in the browser, so driving the panel gives a WebP without any extra step.
  A script that POSTs to `?/upload` still has to compress the bytes itself, because `?/upload`
  stores what it is given

#### 7i-d — The 2026-09-26 batch

173 games were created on geekster.pro as **drafts** (ids 129–301), bringing the table to 300.
The user asked Claude to pick them and will check each one by hand before publishing. Verified
afterwards: dashboard 300 games / 173 drafts / 298 screenshots, and `/api/games` still serves 127.

Rules the user set (asked, not assumed):

- **Year = first full release** on any platform or region; early access and alphas do not count —
  the convention the existing 127 already follow (Minecraft 2011, Among Us 2018)
- A broad mix: classics, AAA, indies, easy and hard to guess, 1962–2026, **no mobile games**
- A screenshot must **not show the game's name**. Where every RAWG shot does, the draft is created
  without one (red `NO SCREENSHOT` badge) rather than with a revealing image

How it was done: RAWG search per game, every candidate screenshot reviewed on a contact sheet, one
picked per game, sometimes cropped to cut a logo or watermark off an edge, then re-encoded to WebP
(longest edge 1600, quality 85 — the same settings as `toWebp()`) and POSTed to
`/admin/games/new/` with `draft=on`, as § "How new games reach production" requires. Two things
a script driving the admin panel needs that a browser supplies on its own: the **trailing slash**
(`/admin/login` answers 308) and **`Accept: text/html`** — without it SvelteKit answers a form
action with a 200 JSON action result instead of the 303, which looks like a failed login.

For the review:

- **No screenshot, on purpose:** _Baba Is You_ — its rule tiles spell BABA IS YOU in nearly every
  level; _Donkey Kong Bananza_ — RAWG has only key art. Both need a hand-picked image
- **Naming:** _God of War (2005)_ and _Alone in the Dark (1992)_ carry the year because the live
  table already has a _God of War_ (2018) and the name alone is ambiguous; _Commander Keen_ uses a
  shot from episode 2 of _Invasion of the Vorticons_ (1990)
- **Year worth a second look:** _Ms. Pac-Man_ 1982 (RAWG says 1981), _X-COM: UFO Defense_ 1994
  (RAWG says 1993), _Super Mario Kart_ 1992 and _Street Fighter IV_ 2008 (RAWG lists later
  western/console dates), _Commander Keen_ 1990
- **Some images are small.** RAWG serves older titles at their native size (e.g. 800 px wide);
  nothing was upscaled

The batch, by release decade, as it stood when it was published (172 games — one, _Donkey Kong
Bananza_, was deleted during the review; _Baba Is You_ got a hand-picked screenshot):

| 1960s | 1970s | 1980s | 1990s | 2000s | 2010s | 2020s |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1     | 7     | 30    | 34    | 30    | 32    | 38    |

**Published on 2026-09-26.** The user reviewed the drafts (publishing some by hand along the way)
and then asked Claude to publish the rest in one go: a `db:dump` of production first, then
`UPDATE games SET published = 1 WHERE published = 0`. Every game on production is now published
and every one has a primary screenshot. 7i-d, and with it Sprint 7, is done.

### Notes

- With draft mode in place the workflow is: create as draft → add and review the screenshot →
  publish. Nothing a session adds is ever visible to players before the checkbox is ticked
- 7i-a and 7i-b are independent; 7i-c depends on 7i-b

---

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

## Sprint 8m - Migrations Run by the Pipeline

> Goal: a release needs no manual database or git step, and "migrate before deploy" is enforced by the
> pipeline instead of a PR description. Planned 2026-09-27, after the slice-2 release. Sized as
> one short session. **Moved behind Sprint 9 on 2026-09-27**, and **behind Sprint 10 on
> 2026-10-02** (the playtest made Sprint 10 the priority). Sprint 10's migration is therefore
> applied by hand, through the runbook, as before

### Why

- Every migration so far (`0001`–`0003`) was applied by hand from a laptop, in an order written
  into the release PR. `0003` showed the order is load-bearing: the new code on the old schema
  serves an empty pool. A step that depends on someone reading a PR description will one day be
  skipped or done in the wrong order
- Not Flyway or Liquibase: Drizzle's migrator already provides versioned SQL, a journal, hash
  checks and a per-database record (`__drizzle_migrations`). What is manual is **who runs it and
  when**, not the tooling

### What stays human

- **The compatibility check.** Every migration must keep the **previous** code working (runbook
  § A migration the running code must survive). With that, "migrate, then deploy" is safe to
  automate; without it, no pipeline helps. It becomes a checklist item in the PR template
- Writing and reviewing the SQL (`db:generate` output is read, rebuilds are hand-written),
  proving a rebuild on a copy of production, and `db:dump` before a risky one

### Tech Tasks

- [ ] **Staging:** a job in a GitHub `staging` environment on every push to `develop`:
      `db:migrate:staging`, a second run as a no-op check, then `PRAGMA integrity_check` and
      `foreign_key_check` (foreign keys are off during `migrate()`, see the runbook)
- [ ] **Production:** the same, on every push to `main`, in a GitHub `production` environment.
      The Turso production URL and token are secrets of that environment only, so no other
      workflow or branch can read them. Optionally a required reviewer, so a migration waits for
      one click from the owner
- [ ] **Ordering — migrate strictly before deploy.** Today Vercel's Git integration deploys the
      moment `main` changes, racing any migration. Proposed: disable Vercel's automatic deploy
      for `main` (`git.deploymentEnabled` in `vercel.json`) and let the workflow run
      `vercel deploy --prod` only after the migration job succeeds. Same for `develop` →
      staging, or accept the race there. Feature-branch previews stay on the Git integration
- [ ] **Decision needed:** this needs a `VERCEL_TOKEN` in GitHub, which reverses the Sprint 7g
      decision ("no `VERCEL_TOKEN` in GitHub — nothing in CI deploys"). Environment-scoped
      secrets and a protected `main` are what would make it acceptable. The alternative that
      keeps 7g intact: Vercel Deployment Checks, where the deploy waits for a GitHub check —
      verify whether the Hobby plan offers them before choosing
- [ ] A failed migration fails the workflow, so nothing deploys. The live app keeps running on the
      old code, which the compatibility rule guarantees still works
- [ ] **Sync `develop` after every release, automatically.** Today step 4 of the branching flow
      (`git merge --ff-only origin/main` on `develop`) is done by hand. The release PR's merge
      commit exists only on `main`, and a hotfix merged into `main` never reaches `develop`
      until someone remembers. Proposed: a job on every push to `main` that fast-forwards
      `develop` to `main` and pushes (`permissions: contents: write`, the built-in
      `GITHUB_TOKEN`). A fast-forward is not a force push, so `develop`'s protection allows it.
      **Only ever a fast-forward:** if `develop` has commits `main` lacks (committed after the
      PR was merged), the job fails visibly and a human merges. It never makes a merge commit and
      never resolves a conflict on its own. Known side effects, both harmless: a push made with
      `GITHUB_TOKEN` starts no other workflow, so CI does not re-run on `develop` for code it
      already checked; Vercel still rebuilds staging from the identical tree. If the
      production-migration job exists by then, run the sync after it, so `develop` is never
      ahead of a migration that failed
- [ ] Update the runbook (rules 3–4, "applied from a laptop, never from CI"), `CLAUDE.md`
      § Schema Migrations and § Deployment & CI (branching step 4 and the hotfix line become
      "automatic, unless the job fails"), and `ci.yml`'s comment

### Deliberately not

- **Migrations in the Vercel build command** (`drizzle-kit migrate && vite build`). It looks
  simpler and orders itself, but every feature-branch preview would migrate the shared staging
  database, and a build that fails after migrating leaves them out of step
- **Database dumps as CI artifacts.** The repository is public. Turso's point-in-time restore is
  the pipeline's safety net; the manual `db:dump` stays for anything risky
- **Down-migrations.** Unchanged from 7h: fix forward

---

## Sprint 9 - Redesign: Design System, Styleguide & New Look

> Goal: Geekster looks and feels like its own product. Every screen after this one is built from
> the design system, not restyled later

Placed straight after Sprint 8 on purpose (decision 2026-09-26): Sprint 8 adds little new UI, while
Sprints 10 and 11 add the three biggest new surfaces. **Planned in detail on 2026-09-27, at sprint
start, and it runs before Sprint 8m** (decision 1 below).

### Start here (for the implementation session)

**State on 2026-09-28: 9a is done and approved. 9b is done on `develop` and verified on staging
(see "9b — what was built"); it is not released on its own (decision 9 below), so production
still runs Sprint 8. 9c, 9d and 9e are done on `develop` (see "9c — what was built", "9d — what
was built", "9e — what was built" and "9f — what was built"). 9g is done on `develop`
too (see "9g — what was built"); what is left is the one release PR.
No slice is released on its own: the whole of Sprint 9 goes to production in one release after
the last slice (decision 10, "Branching").**

1. Read this section to the end: the decisions, the audit, the HUD spec, 9a's "Design calls",
   the token table, **"9b — what was built"**, **"9c — what was built"**, **"9d — what was
   built"** and **"9e — what was built"** (what exists now). Then
   `CLAUDE.md` § Game Logic and § Conventions (tokens and primitives only, transitions from
   `$lib/motion`), then the file you are about to touch. The "Delivery order" table says what each
   slice asks first. 9c and 9d ask nothing: everything they need is decided
2. **The design lives on a Claude Design canvas:**
   <https://claude.ai/artifact/7Ay9wtudti5RL6CHx9W1v1>, page **"M3 · Full design"** (the
   "Exploration" page is the history of how M3 was chosen). It's private to the owner. Read it
   with the Artifact tool's `read` action and a `path` (`project/canvas.json` lists the boards;
   each board is `project/M3<Name>.dc.html`), never with WebFetch. Its markup is a mock-up, not
   code to copy: the values are in the token table here, and the structure is in the design calls
3. **From 9b on, the code is the source of truth**: `src/app.css` `@theme` plus `/styleguide`.
   The canvas is the reference it was built from, and nobody keeps it in sync after 9b. If an
   implementation choice differs from a board, correct this section, not the canvas
4. `scratchpad/sprint9-design/` (gitignored, this laptop only) holds a local copy of the boards.
   It may be older than the canvas, because the user can edit boards in the canvas editor.
   **The canvas wins**
5. **Every slice is committed on `develop`** and pushed, so staging shows it. **Nothing is merged
   into `main` until Sprint 9 is complete** (decision 10, "Branching")
6. **What already exists for 9c–9e to build with** (9b): the tokens in `src/app.css`; the
   primitives in `src/lib/components/ui/` (`Button`, `IconButton`, `Chip` incl. the `multiplier`
   and `mystery` tones, `Surface` incl. the `magenta` HUD frame, `TextField`, `SegmentedControl`,
   `Toast` with its live region (deleted in 9f, unused since 9d), `Wordmark`, `IconMark`, `HorizonGrid`, `icons/Heart` full / empty
   / socket, `icons/CreditCoin`); `$lib/motion` (`DURATION`, `EASE`, `fade`/`fly`/`slide`/`scale`);
   `AppHeader` in the root layout. **Added by 9c:** `icons/Heart` `broken`; `Surface` frames
   `danger-glow` / `life-glow`; `RunHud` (with `compact`) and `StreakMeter`; `AppHeader`'s `score`
   prop (the header collapse); `FeedbackToast`; `CurrentCard`, `Timeline` / `TimelineRow`; the
   `DragPlace` class in `src/lib/dragPlace.svelte.ts` (one instance, made in `GameScreen`);
   `streakMeter()` and `hudMoment()` in `placement.ts`; `formatNumber()` / `formatMultiplier()`
   in `i18n.svelte.ts`; `countUpDuration()` in `$lib/motion`. **Added by 9d:** the year-first
   `TimelineRow` (statuses settled / hidden / placed / misplaced, `compact`), `TimelineSlot`
   with its accessible name, `DecadeRuler`, the answer card in `ScoreReveal`, the M3
   `BonusGuessPanel`; `decadeBuckets()` and `ghostSlotIndex()` in `placement.ts`;
   `headerScore`; `Button`'s bindable `ref`; the desktop `100dvh` shell in `+layout.svelte`
   while playing. **9e can reuse `TimelineRow compact` for the result screen's timeline** (with a
   miss marked `misplaced`) and then delete `GameCard`. `/styleguide` shows all of it.
   **Use these, and extend them there rather than restyling inline.** A new primitive gets its
   own section on `/styleguide` in the same commit
7. **Playing a run locally** needs `local.db` with games (`npm run db:migrate && npm run db:seed`
   if it's missing; it exists on this laptop). Don't edit repo files while a scripted run is going
   against `npm run dev`: the HMR reload drops the page back to the welcome screen. The memory note
   on driving headless Brave over CDP covers clicking through a run. **The 9c drivers are in
   `scratchpad/cdp/`** (gitignored, this laptop only; its README has the usage): `run.mjs`
   plays a scripted R/W run with screenshots, animation logs and frame bursts, plus touch,
   HTML5-drag, count-up, styleguide and preview checks. **For Pro locally:**
   `local.db` on this laptop has 40 Pro primaries (copied from Normal shots in 9c, local only),
   and the gate needs `PRO_MIN_POOL_OVERRIDE=5 npm run dev` (set in the shell, not in `.env`)
8. **The boards for 9e:** `M3Welcome` (first visit), `M3Returning` (returning, in German, with
   the leaderboard tabs), `M3DeskWelcome` (desktop), `M3Result` (game over, long run),
   `M3Perfect` (perfect run, the striped sun), plus `M3States` (mode choice, result headlines,
   leaderboard empty / loading, the welcome error box). 9d used `M3Play`, `M3Drag`, `M3Bonus`,
   `M3RevealOk`, `M3RevealWrong`, `M3DeskPlay`, `M3DeskLong` and `M3States`

### Where Sprint 9 starts (audited 2026-09-27)

- **Favicon:** `src/lib/assets/favicon.svg` is SvelteKit's default Svelte logo
- **Link previews:** none. There's no meta description, no `og:*` or `twitter:*` tags, no
  `apple-touch-icon` and no web manifest. `<title>` is "Geekster" on every screen. A link sent in
  WhatsApp shows the bare URL
- **`<html lang="en">`** is fixed in `src/app.html`. It never changes, even when German is on.
  (Found in 9b: the server actually renders **German**, since `loadLocale()` defaults to `de` when
  there is no localStorage, so `en` was wrong for the server's HTML too)
- **No tokens.** `src/app.css` holds one keyframe (`heart-pop`). Colours are raw Tailwind palette
  classes (`purple-600`, `gray-900`, `green-400` …) spread across ten components. Buttons differ
  per screen in radius, size and colour
- **`GameScreen.svelte` is 563 lines**: HUD, feedback banner, current card, drag and drop
  (HTML5 and touch), bonus panel host, reveal and timeline in one file. The code-style rule is
  ~200 lines of logic per component
- **Motion:** Svelte `fly`/`fade`/`slide` everywhere. Only the heart pop honours
  `prefers-reduced-motion`
- **Staging is behind Vercel Authentication**, so a link-preview crawler (WhatsApp, Discord,
  Signal …) gets a 302 there. On staging the meta tags can only be checked by reading the HTML
  (with an access link from `get_access_to_vercel_url`). The real preview can only be checked on
  production

### Decisions made while planning (asked, not assumed — 2026-09-27)

| #   | Question                     | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sprint 9 before 8m?          | **Yes.** Sprint 9 needs no migration. 8m earns its keep when Sprint 10 adds tables, so it moves to just before Sprint 10                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2   | Design tool                  | **Claude Design** (a claude.ai Design canvas) for the directions and the full screen set. No Figma. The code is the source of truth from 9b                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3   | Visual direction             | **Open.** The user wanted to see all four first. They're drafted on the canvas (main game screen, phone): A retro arcade/CRT, B modern console UI, C collectible cards (light), D synthwave neon. A mix is allowed. **Shortlist (2026-09-27): D first, A second**, but the user isn't a fan of purple. So four D variants were added: D2 turquoise synthwave, D3 cyberpunk (yellow/cyan/red, angular), D4 neo-machi (neon night city, katakana signage) and D5 neon arcade '87 (A × D, San Junipero). The user's keywords: retro-futuristic, neon 80s, Cyberpunk 2077, Black Mirror. The final pick is the first question of 9a |
| 4   | "Rupees" and the Zelda rupee | **Replaced by Geekster's own score currency: Credits (CR)**, a gold coin (chosen at 9a's start). Hearts stay (generic)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 5   | The energy bar               | **The bar is the streak** (spec below). One streak display with the multiplier. A heart socket at the bar's end appears only while a life is missing                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 6   | Sound                        | **Not in Sprint 9.** It stays Idea 5 in `ROADMAP.md`. The existing `navigator.vibrate(30)` on a touch-drag start stays. No new haptics                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 7   | Link previews                | **Static:** favicon set, apple-touch-icon, web manifest, one 1200×630 OG image, title and description, plus a **share-card template** designed for Sprint 10's per-result image. No server-rendered image yet                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 8   | Legal pages                  | **Last slice of Sprint 9 (9g)**, in the new look. The user supplies the Impressum details at its start. Nothing personal goes into the repo before then                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 9   | Release 9b on its own?       | **No** (2026-09-28). 9b stays on `develop`, unreleased, and ships with the redesign                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 10  | Where do 9c–9g go?           | **`develop`, and staging, slice by slice** (2026-09-28). No feature branch: staging may show a half-new game. **`main` gets nothing until Sprint 9 is complete**; then one release PR carries 9b–9g to production. `feature/redesign` (used for 9c) was merged into `develop` and deleted                                                                                                                                                                                                                                                                                                                                       |
| 11  | Desktop layout of a run?     | **One column on every screen** (2026-09-28, after trying two): the phone's model, larger, within 880 px, with a pinned bar (compact HUD + card strip) once the card scrolls off and a decade ruler beside the column from 1280 px. Supersedes 9a's two-column and fixed-shell design calls. No layout switch mid-run                                                                                                                                                                                                                                                                                                            |

### UX audit (2026-09-27)

Every screen and state in the code, checked against Nielsen's ten heuristics, WCAG 2.2 AA and
mobile game conventions. The last column says which slice fixes it.

| #   | Where        | Finding                                                                                                                                                                                                       | Heuristic                              | Slice   |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------- |
| U1  | HUD          | The green bar means two things: progress to a life, then (lives full) a dimmed bar that still fills and is labelled "lives full". Same control, different meaning by state                                    | Consistency; match with the real world | 9c      |
| U2  | HUD          | The streak is shown twice: the bar, and an orange "7x streak" text that appears only from streak 2 and pushes the HUD row sideways (layout shift)                                                             | Consistency; minimalist design         | 9c      |
| U3  | HUD          | The streak's actual reward, the ×1.0–1.5 score multiplier, isn't visible until the score breakdown                                                                                                            | Visibility of system status            | 9c      |
| U4  | HUD          | The labels are 10 px, in `green-500/80`, `red-500/80` and `gray-400`. That's below a readable size, and the contrast was never checked                                                                        | WCAG 1.4.3 / 1.4.4                     | 9b + 9c |
| U5  | HUD          | "Rupees" and a Zelda rupee icon: a borrowed trademark in a public brand                                                                                                                                       | —                                      | 9c      |
| U6  | HUD          | "PLACED" repeats what the timeline already shows and is one more number to parse                                                                                                                              | Minimalist design                      | 9c      |
| U7  | Feedback     | The banner is fixed at the top and covers the HUD for 5 s. It's not in a live region, so a screen reader never hears "Correct!"                                                                               | Visibility; WCAG 4.1.3                 | 9c      |
| U8  | Wrong        | The card is auto-inserted where it belongs, but nothing shows where you put it compared with where it goes, which is the moment a player learns something                                                     | Help users recognise errors            | 9d      |
| U9  | Current card | Sticky and full width at 16:9, it takes ~45 % of a 390×844 screen. While dragging, little of the timeline is visible                                                                                          | Flexibility; Fitts                     | 9d      |
| U10 | Timeline     | The screenshot dominates a row, while the year, the only thing a placement decision needs, is small and right-aligned                                                                                         | Recognition rather than recall         | 9d      |
| U11 | Placing      | "Place in the timeline" doesn't say that tapping a slot works. Players who don't find the 250 ms long-press think the game is broken                                                                          | Visibility; affordance                 | 9d      |
| U12 | Bonus        | Autofocus on the year field opens the phone keyboard over the screen as the 30 s timer starts. `type="number"` changes its value on a scroll-wheel turn. The placeholders ("e.g. 2004") are English in German | Error prevention; i18n                 | 9d      |
| U13 | Bonus        | The timer warns only with a colour change at ≤ 5 s, and nothing is announced                                                                                                                                  | WCAG 1.4.1 / 2.2.1                     | 9d      |
| U14 | Welcome      | Six numbered rules stand between the title and the Play button. They're read once and forgotten by the time they matter                                                                                       | Minimalist design; recognition         | 9e      |
| U15 | Result       | After a long run, Play Again and Main Menu sit below the leaderboard and the entire timeline (50+ rows). The primary action is buried                                                                         | Visibility; Fitts                      | 9e      |
| U16 | Result       | The final timeline doesn't mark which cards were misplaced (`roundScores[i].base === 0`), which is the most useful thing to learn from                                                                        | Help users recognise errors            | 9e      |
| U17 | Global       | There's no consistent `focus-visible` ring. Every screen draws its own buttons                                                                                                                                | Consistency; WCAG 2.4.7                | 9b      |
| U18 | Global       | Only the heart pop honours `prefers-reduced-motion`                                                                                                                                                           | WCAG 2.3.3                             | 9b–9e   |
| U19 | Global       | `<html lang>` stays `en` in German, so a screen reader reads German with English rules                                                                                                                        | WCAG 3.1.1                             | 9b      |
| U20 | Global       | There's no app header. The language switch floats `absolute` over the content, and each screen draws its own title                                                                                            | Consistency                            | 9b      |
| U21 | Global       | The RAWG credit is 10 px `gray-700` on `gray-950` (~1.9:1). It's a credit we owe and nobody can read it                                                                                                       | WCAG 1.4.3                             | 9g      |
| U22 | Sharing      | There's no link preview, and the favicon is Svelte's                                                                                                                                                          | —                                      | 9b      |

### The HUD: the bar is the streak (decision 5)

The rules it must show: the multiplier is `getStreakMultiplier()` in `scoring.ts`, ×1.0 at
streak 1, +0.1 per game and capped at ×1.5 from streak 6. `regainsLife()` in `placement.ts` gives a
life back at every multiple of `LIFE_REGAIN_STREAK` (10) while lives < 3. The drawn states are on
the canvas's "Streak bar: the four states" board.

- **One pure function, unit-tested:** `streakMeter(streak, lives, maxLives)` in `placement.ts`,
  returning
  `{ filled, multiplier, socket, toNextLife }`:
  - `filled` (0–10): `streak === 0 ? 0 : ((streak - 1) % 10) + 1`. So 7 → 7, 10 → 10 (a full
    bar, the moment the life comes back), 11 → 1 and 20 → 10
  - `multiplier` is the multiplier **the next correct placement will earn**:
    `getStreakMultiplier(streak + 1)`. `game.svelte.ts` scores a round with the streak _after_ the
    placement, so this is the number the player is playing for. At 0 it reads ×1.0, at 1 ×1.1
    and from 5 ×1.5
  - `socket`: `lives < maxLives`. The heart socket at the bar's end exists only then
  - `toNextLife`: `10 - (streak % 10)` while a life is missing, else `null`
- **The component** (`StreakMeter.svelte`): the label "Streak N", a ×multiplier chip, 10
  segments (`role="progressbar"`, `aria-valuenow={filled}`, `aria-valuemax=10`, and an
  `aria-label` that says the whole state in words), the socket when there is one, and a caption:
  "N more in a row for +1 life" with a socket, and the multiplier status without. **The separate
  "Nx streak" text and the dimmed "lives full" state are removed**, and so are the
  `hud.livesFull` / `hud.streak` strings that no longer have a use
- **Streak hits 10 with a life missing:** the bar fills and flashes, the socket fills, a heart
  travels from the socket to the empty life, and the segments empty for the next lap. With
  reduced motion it's a crossfade. The toast says "+1 life". **Streak hits 10 with lives full:**
  the bar flashes and there's a short "10 in a row!", no life
- **Wrong placement:** a heart breaks, the bar drains right to left (~400 ms) and the chip drops to
  ×1.0 and turns neutral. The loss shows where the gain was
- The HUD row is **fixed-width**. Nothing appears or disappears in it between states, so there's
  no layout shift (U2)

### Branching: every slice on `develop`, one release at the end (decision 10)

The user wants **the complete redesign as one update to production**, and staging is where the
slices are looked at in between. So, from 2026-09-28:

- **Every slice (9c–9g) is committed on `develop` and pushed**: staging.geekster.pro shows it a
  few minutes later. Staging may show a half-new game (a new HUD over an old welcome screen); that
  is expected and fine. Test a slice on staging before calling it done
- **Nothing is merged into `main` until Sprint 9 is complete**, i.e. after 9g. Then one release
  PR `develop` → `main` carries 9b–9g, followed by the production checks (the link previews in
  the messengers, see 9b's "Verify"). No migration is involved anywhere in Sprint 9
- **No `feature/redesign`.** 9c was built on one (the old plan, to keep `develop` releasable);
  it was fast-forwarded into `develop` on 2026-09-28 and deleted. Don't recreate it
- **Consequence: `develop` is not releasable until Sprint 9 is done.** A fix production can't
  wait for goes `hotfix/*` off `main` → PR → `main`, then `git merge origin/main` into `develop`
  (`CLAUDE.md` § Deployment & CI). Never release `develop` early to ship a fix
- Before each push: `npm run lint && npm run check && npm run test && npm run build` (CI on
  `develop` runs after the push, so a red run means staging is already broken)

### Delivery order

Seven slices, **one session each** (9d is the largest: if it runs long, split the bonus panel and
reveal off into their own session). Not one session for the sprint: each slice ends verified, and
a session that holds the whole redesign in context does none of it well. 9a is design only and
may take two short rounds with the user between them. If a slice finds this plan wrong, it
corrects this section in the same commit.

| Slice                    | Content                                                                                                     | Branch    | Release                | Stories       | Ask at its start                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | --------- | ---------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| **9a** ✅ done, approved | Direction chosen, then every screen and state designed on the canvas; tokens, logo, icons, OG, share card   | —         | none (design only)     | 9.1           | direction (or mix), currency name, logo form, desktop layout, one theme or two               |
| **9b** ✅ done           | Foundation: tokens, self-hosted fonts, UI primitives, app header, `/styleguide`, favicon set, link previews | `develop` | with 9g (decision 10)  | 9.1, 9.3, 9.4 | —                                                                                            |
| **9c** ✅ done           | `GameScreen` split up (no visual change), then the HUD, the streak bar, currency, toast                     | `develop` | with 9g                | 9.2, 9.3      | —                                                                                            |
| **9d** ✅ done           | Playing screen: current card, timeline rows, slots, drag, wrong-placement feedback, bonus panel, reveal     | `develop` | with 9g                | 9.2, 9.3      | —                                                                                            |
| **9e** ✅ done           | Welcome, mode choice, result, leaderboard, loading and error states                                         | `develop` | with 9g                | 9.2, 9.3      | first-run hint: **coach mark** (decided 2026-09-28)                                          |
| **9f** ✅ done           | Quality pass (Lighthouse, axe, keyboard, screen reader, reduced motion, CLS); admin gets the tokens         | `develop` | with 9g                | 9.3           | —                                                                                            |
| **9g** ✅ done           | Legal: Impressum, privacy, takedown contact, screenshot credit, footer                                      | `develop` | **one release, 9b–9g** | —             | operator's details, which country's rules (AT/DE), per-screenshot credit now or in Sprint 11 |

9g is last because the user chose it (decision 8). It depends only on 9b (tokens, Button, the
footer), so it can move earlier if the user wants; it still goes out with the one release

### User Stories

- [ ] US-9.1: As a player, Geekster has a distinct visual identity (logo, colour, type, motion)
      that makes it recognisable in a shared link or a screenshot
- [ ] US-9.2: As a player, every screen works as well on a phone as on a desktop, and feedback on
      a placement feels satisfying (motion; sound is deferred, decision 6)
- [ ] US-9.3: As a player with a disability, contrast, focus states and reduced motion are
      respected (WCAG 2.2 AA)
- [ ] US-9.4: As the developer, a living styleguide shows every component in every state, built
      from the real components so it cannot drift
- [x] US-9.5: As a player, the streak display tells me at a glance how long my streak is, what it
      multiplies my points by, and how far away the next life is, if I'm missing one
- [ ] US-9.6: As a player sharing a link, the messenger shows Geekster's name, a one-line pitch and
      a preview image

### Tech Tasks

#### 9a — Direction and full design (no code)

- [x] Four directions drafted on the canvas as the main game screen, phone, mid-run: lives 2/3,
      streak 7, a card to place, a year-first timeline (2026-09-27)
- [x] The streak bar's four states drawn direction-neutral: life missing, lives full, streak hits
      10, wrong placement
- [x] First round: D (synthwave) preferred, A second, less purple wanted. Variants D2–D5 drawn
      (2026-09-27)
- [x] Second round: **D2 preferred**, D4 close behind. Two mixes drawn (2026-09-27): M1 "neon
      sign" (D2 + D4's glowing heading + D4's pink HUD border + D3's `// TIMELINE PROTOCOL`
      tagline) and M2 "glitch" (the same, with D3's hard RGB-split heading echoed on the card frame)
- [x] **Direction chosen and confirmed (2026-09-27): M3**, the canvas board "M3 · M2 refined". It's M2 (D2's
      turquoise synthwave base, Dela Gothic One heading with a pink/turquoise RGB split, D4's pink
      HUD border) with:
  - the tagline `// TIMELINE PROTOCOL v9` in pink (`#ff7ae6`), as in M1
  - a light glow on the heading on top of the split
  - on the card to place, M1's turquoise frame with a **pink** glow (`#ff2bd6`), the same pink as the HUD border
  - **the horizon grid calmed** (the user's concern: its lines looked like strikethroughs through
    "Place here" and cut its contrast): opacity 0.3 (0.16 was too faint, the user's feedback), a 0.5 px blur, masked to fade
    out over the top third. Slots and rows sit on opaque surfaces, so no line ever runs behind text. **Rule for 9b:
    decoration never shows through text; every text-bearing surface is opaque**
- [x] The user confirmed M3 as final (2026-09-27)
- [x] **Answers at the start of the full design (2026-09-27):** currency **Credits (CR)**; logo =
      **wordmark + a separate icon mark**; desktop ≥ 1024 px = **two columns**; **dark only**
- [x] **The full design, on the canvas page "M3 · Full design"** (2026-09-27), 17 boards:
  - phone: welcome (first visit; returning, in German), playing idle, dragging, bonus guess with
    the keyboard open, reveal correct, reveal wrong, streak 10 / life back, result (game over,
    long run), result (perfect run)
  - desktop 1280: playing (two columns), welcome
  - tokens; components and states (buttons, chips, the Pro header, slots, toasts, mode choice,
    timer, result headlines, leaderboard empty/loading, the error box)
  - brand (wordmark, icon mark at 512/180/32/16, the credit coin); the OG image; the share-card
    template with `{SCORE}`, `{MODE}` … slots for Sprint 10
- [x] Every text/background pair measured (below). Two fixes came out of it: control borders use
      `line-strong` (the M3 draft's `#1b5a66` was 2.5:1, under the 3:1 a control boundary needs),
      and text on magenta is always dark (white on `#ff2bd6` is 3.2:1)
- [x] The user reviewed the full-design page and approved it ("I love it", 2026-09-27), with one
      addition: a long timeline on desktop must keep the overview (next bullet)
- [x] **Long timeline on desktop** drawn as the board "Desktop · long timeline, mid-drag: fixed
      shell, decade ruler" (2026-09-27). See the design call below

##### Design calls the boards make (the implementation follows them)

- **The HUD compacts to one line while dragging** (hearts, bar, chip, score) and **collapses into
  the header while the bonus keyboard is open** (the score moves next to the wordmark). A phone
  keyboard leaves ~550 px, and the bonus panel has to fit in it with its buttons
- **Toasts sit in the flow under the HUD** (superseded in 9d's review: they float top left), never over it (U7): correct turquoise ✓, wrong red ✗,
  life pink ♥, "10 in a row" with lives full turquoise ★
- **Wrong placement:** the HUD border turns red for the moment and the broken heart shows. The
  timeline shows a red dashed "You put it here" ghost where the card was dropped and the card in
  its right place with a red frame, "Belongs here", then "Next card". No bonus round
- **Life back:** the whole bar flashes white-turquoise, a dotted pink arc runs from the bar's end
  to the heart that returns (reduced motion: the heart fades in), and the HUD border glows pink
- **Result:** the headline, then the score and "new personal best" when it is one, then 4 stats,
  then **Play again / Menu directly under them**. Because they sit above the fold, the sticky
  bottom bar from the 9e task is **not needed**. Then the leaderboard (this device / global), then
  "Your timeline · N" as compact rows with misses framed red and marked ✗. Headline colours:
  Game over red glow, Pool cleared turquoise, Perfect run gold (with a striped synthwave sun)
- **Pro's mode colour is pink:** the selected Pro segment, the `PRO` chip, and the badge beside the
  wordmark during a Pro run. Normal is turquoise
- **Welcome:** the wordmark large, the pitch in two sentences, the mode choice, one 56 px START
  RUN, "How to play ▸" as a text button. The rules are gone from the first screen (U14). A
  returning player gets "Welcome back, your best: N CR" and the leaderboard tabs (this device /
  global / classic when it exists)
- **Desktop playing:** left column 440 px (HUD, the card to place, a hint with the keyboard path
  Tab → Enter), right column the timeline up to 680 px with 128 × 72 thumbnails. The page scrolls
  the right column only; the left one is sticky
- **Year chip on the card to place:** always `????`, in the display face with the RGB split
- **Superseded by decision 11 (2026-09-28): one column on every screen, see "9d — what was
  built".** The next call and "Desktop playing" above describe the design as drawn
- **Desktop with a long timeline (the user's point, 2026-09-27): the page never scrolls.** From
  1024 px the app is a fixed shell of `100dvh`: the header and the left column (HUD, the card to
  place, the hint) never move, and **only the timeline pane scrolls** (its own
  `overflow-y: auto`). That is more robust than a `position: sticky` column: nothing jumps, and
  the card and the lives are always in the same place. On top of it:
  - **A decade ruler** beside the pane (72 px wide): one button per decade the timeline holds
    (80s · 90s · 00s · 10s · 20s), its height proportional to its card count (at least 44 px),
    the count on it, and the decade in view highlighted (`aria-current`). A click scrolls the
    pane to that decade. **While dragging, hovering a decade scrolls there**
  - **Pinned decade labels:** each decade starts with a label ("2000s", pink) that sticks to the
    top of the pane while that decade is in view, with the count "Your timeline · 34" next to it
  - **Auto-scroll while dragging:** a 64 px zone at the pane's top and bottom edges. The pane
    scrolls while the dragged card is in it, faster the deeper in, with a turquoise edge and
    "▼ SCROLLING" as the cue. Touch already has this for the whole page; desktop gets it for the
    pane
  - **The pane never scrolls towards an answer.** It keeps its position between cards and never
    jumps to the card's decade or to the last placement: that would give the year away. It moves
    only for the reveal: the placed card scrolls into view there, and for a wrong placement so do
    its ghost and its right place
  - Past `COMPACT_TIMELINE_AT` the rows are the compact 40 px ones (year + name) and the slots
    36 px. On desktop both are pointer targets, so 36 px is fine against WCAG 2.5.8's 24 px
  - **Phones** keep the page scroll and the shrinking card strip. Whether a narrow decade ruler
    fits on a phone's right edge is tried in 9d and decided there
- **The slot copy is "+ PLACE HERE"**, "▼ DROP HERE ▼" on the drop target, whose height grows to
  60 px while dragging

##### Tokens (9b's input: copy these into `@theme`, the canvas holds nothing more)

Contrast is against `bg` unless another surface is named. Fonts: **Dela Gothic One** (display:
wordmark, headlines, `????`), **Chakra Petch** 500/700 (UI: labels, buttons, years, every number,
tabular), **Exo 2** 400/500/600 (body). All OFL, self-hosted.

| Token            | Value     | Use                                                        | Contrast          |
| ---------------- | --------- | ---------------------------------------------------------- | ----------------- |
| `bg`             | `#03101a` | page ground                                                | —                 |
| `surface`        | `#061824` | HUD, bonus panel, leaderboard                              | —                 |
| `surface-raised` | `#06202c` | timeline rows, icon buttons                                | —                 |
| `surface-sunken` | `#04151f` | slots, secondary buttons                                   | —                 |
| `accent-soft`    | `#0a3a40` | selected tab, drop target, correct toast                   | —                 |
| `line`           | `#16444f` | dividers only                                              | 2.2               |
| `line-strong`    | `#2a8a93` | every control border, slot dashes                          | 4.4 on surface    |
| `ink`            | `#e8fbff` | text                                                       | 18.0              |
| `ink-muted`      | `#9cc9d1` | secondary text                                             | 10.7 (10.0 surf.) |
| `ink-subtle`     | `#6f98a1` | disabled                                                   | 6.1               |
| `accent`         | `#3ff0e4` | primary buttons, streak bar, Normal                        | 13.5              |
| `accent-strong`  | `#5ff5e8` | years, "STREAK N"                                          | 14.4              |
| `on-accent`      | `#03101a` | text on accent, pink and magenta                           | 13.5 / 8.4 / 6.0  |
| `focus`          | `#f2fffe` | 2 px ring outside a 2 px `bg` gap                          | 18.8              |
| `magenta`        | `#ff2bd6` | HUD border, card glow, RGB split — borders and glow only   | 6.0 (5.6 surf.)   |
| `pink`           | `#ff7ae6` | tagline, section labels, `PRO`, `NEW`, `COMING SOON`       | 8.4               |
| `life`           | `#ff3d9a` | hearts                                                     | 5.8               |
| `life-empty`     | `#7a6a96` | a lost heart's outline                                     | 3.7 on surface    |
| `danger`         | `#ff4d6d` | wrong placement, misses, timer ≤ 5 s, always with ✗        | 6.0               |
| `danger-soft`    | `#1f0c16` | wrong fills                                                | —                 |
| `score`          | `#ffd98a` | credits (coin `#ffc857`, rim `#8a5a00`) — gold means CR    | 14.2              |
| `grid`           | `#1de9d6` | the horizon grid, opacity 0.3, blur 0.5 px, top-third fade | decoration        |

| Group   | Values                                                                                                                                                                                                                                                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type    | display 24/32/38 (headlines), 27/44/68 (wordmark); UI 11–13 caps +1.5 px, 15–17 buttons, 22/26 years; body 13/15/17, lh 1.5. Min 12 px; the 10 px tagline is decoration                                                                                                                                                    |
| Space   | 4 · 8 · 12 · 16 · 24 · 32 · 48; page gutter 16 (phone), 40 (desktop)                                                                                                                                                                                                                                                       |
| Radius  | 4 chips · 6 thumbnails, tabs · 8 buttons, panels · 10 cards, rows                                                                                                                                                                                                                                                          |
| Effects | glow-accent `0 0 16px rgb(63 240 228 / .45)`; glow-magenta `0 0 12px rgb(255 43 214 / .3)`; glow-card `0 0 22px rgb(255 43 214 / .5), 0 0 6px rgb(255 43 214 / .4)`; rgb-split `-2.5px 0 magenta, 2.5px 0 accent` (+ `0 0 9px accent/.5` on the wordmark), only on the wordmark, headlines, `????` and the multiplier chip |
| Motion  | fast 120 ms · base 200 · slow 400 · reveal 900; ease-out `cubic-bezier(.2,.8,.2,1)`, in-out `(.65,0,.35,1)`, overshoot `(.34,1.56,.64,1)`; reduced = opacity only, ≤ 120 ms, the score jumps                                                                                                                               |
| Targets | ≥ 44 px, primary actions 52–56 px                                                                                                                                                                                                                                                                                          |

#### 9b — Foundation

**Scope:** everything the later slices build on, and nothing they own. The game screens are not
restyled here: they keep their look, except that `body` takes the tokens' ground and ink, and the
app header replaces the floating language switch. So a 9b release changes little on screen; what
players notice is the favicon and the link preview. **Done when** every box below is ticked,
`/styleguide` renders every primitive in every state at 390 and 1280 px, staging serves the head
tags, and the release PR `develop` → `main` is merged (no migration). Then sync `develop` as in
`CLAUDE.md` § Deployment & CI, step 4, and cut `feature/redesign` off `develop` for 9c.
**Superseded by decisions 9 and 10:** 9b is done without the release, and there is no
`feature/redesign`; the release PR and the production link-preview checks move to the one
Sprint 9 release after 9g.

- [x] **Tokens in `@theme`** in `src/app.css`, exactly the names and values of 9a's token table,
      prefixed by kind: `--color-bg`, `--color-surface`, `--color-surface-raised`,
      `--color-surface-sunken`, `--color-accent-soft`, `--color-line`, `--color-line-strong`,
      `--color-ink`, `--color-ink-muted`, `--color-ink-subtle`, `--color-accent`,
      `--color-accent-strong`, `--color-on-accent`, `--color-focus`, `--color-magenta`,
      `--color-pink`, `--color-life`, `--color-life-empty`, `--color-danger`,
      `--color-danger-soft`, `--color-score`, `--color-coin`, `--color-grid`; `--font-display`
      (Dela Gothic One), `--font-ui` (Chakra Petch), `--font-body` (Exo 2); `--radius-*`;
      `--shadow-glow-accent`, `--shadow-glow-magenta`, `--shadow-glow-card`; `--text-shadow-split`;
      `--ease-out`, `--ease-in-out`, `--ease-overshoot`; the four durations. Tailwind v4 turns
      them into utilities (`bg-surface`, `text-ink-muted`, `font-display`, `shadow-glow-card`).
      **Don't reset Tailwind's default palette** (`--color-*: initial`): the admin panel still uses
      `gray-*` and gets the tokens only in 9f. `heart-pop` stays. `body` gets `bg-bg text-ink
font-body`, which replaces `bg-gray-950 text-white` in `+layout.svelte`
- [x] **Fonts self-hosted** through the three `@fontsource` packages (decided; see "Start here",
      step 6), latin subset only, the weights in the token table and no others,
      `font-display: swap`, and a `<link rel="preload">` for the Dela Gothic One woff2 (import it
      with `?url`). **Never from Google's CDN:** the
      Munich Regional Court fined a site in 2022 for passing visitors' IP addresses to Google
      through embedded Google Fonts (LG München I, 3 O 17493/20). The privacy page (9g) can then
      say that no third party receives anything from a page view
- [x] **UI primitives** in `src/lib/components/ui/`: `Button` (primary / secondary / ghost, sizes,
      loading, disabled), `IconButton` (`aria-label` required by its props type), `Chip`,
      `Surface`, `TextField`, `SegmentedControl` (what `ModeChoice` becomes), `Toast` with a
      polite `aria-live` region, and the icon set (heart full/empty/socket, the currency).
      Touch targets ≥ 44 px, and one `focus-visible` ring from `--color-focus`
- [x] **Motion:** `src/lib/motion.ts` with the durations and easings, plus a wrapper for Svelte
      transitions that sets the duration to 0 when `prefersReducedMotion.current`
      (`svelte/motion`, available in the installed Svelte 5.51) is true. Every later slice uses it
      instead of raw `fly`/`fade`
- [x] **App header** (`AppHeader.svelte`): wordmark, the Pro badge while a Pro run is on, the
      language switch. It replaces the absolutely positioned `LangSwitch` in `+layout.svelte`
- [x] **`<html lang>` follows the language**: set `document.documentElement.lang` on switch and
      on load. The server renders `en`, because the language lives in `localStorage` and the
      server can't know it
- [x] **`/styleguide`**: a route rendering every primitive in every state, built from the real
      components. It has `<meta name="robots" content="noindex">` (the hook's `X-Robots-Tag`
      covers only non-production), isn't linked anywhere, and is listed in the structure docs.
      Decided here: this route is the living styleguide (the old 9c's "decide in 9a")
- [x] **Brand assets, rendered from the real fonts:** the icon mark (the "G" with the RGB split
      on its dark square with a magenta edge; the horizon grid only from 180 px up) and the OG
      image are built as Svelte pages under `/styleguide/brand/*` (one per asset, the exact pixel
      size, no chrome), from the canvas boards "Brand" and "OG image". A committed script
      `scripts/render-brand-assets.cjs` (`npm run brand:render`) starts headless Brave against
      the dev server, screenshots each page over CDP (the approach used to verify Sprint 8; `ws`
      is already in `node_modules`), compresses with `sharp` (already a devDependency) and writes
      `static/`: `favicon-16.png`, `favicon-32.png`, `favicon.ico` (a PNG-in-ICO container of
      16 + 32, a few lines of header code, no new dependency), `apple-touch-icon.png` (180,
      opaque), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (the G inside the centre
      80 %) and `og-image.png` (1200×630, under 300 kB). **No SVG favicon:** it would need the G as
      an outlined path, since a favicon can't load a web font, and PNG + ICO cover every browser.
      The generated files are committed. The script runs on a laptop only, when the brand changes,
      never in CI, and its usage goes in its header comment and the README command table.
      Delete `src/lib/assets/favicon.svg` (the Svelte logo) and its import in `+layout.svelte`
- [x] **`site.webmanifest`**: `name`, `short_name`, icons, `theme_color`, `background_color`.
      `display` stays `browser`: making Geekster installable is Idea 6, not this sprint
- [x] **Link previews** in `+layout.svelte`'s `<svelte:head>`: `<meta name="description">`,
      `og:title`, `og:description`, `og:type=website`, `og:url`, `og:site_name`, `og:locale=en_US` + `og:locale:alternate=de_DE`, `og:image` (**absolute**, `${page.url.origin}/og-image.png`),
      `og:image:width/height/alt`, `twitter:card=summary_large_image` and `theme-color`. The text
      is English, because crawlers get the server-rendered default language. The image is a PNG
      or JPEG under 300 kB, not WebP: WhatsApp drops larger images and some clients still ignore
      WebP. The admin pages get none of it
- [ ] **Verify:** `curl` the HTML on staging (with an access link) for every tag. After the
      production release, send the link in WhatsApp, Signal, iMessage, Telegram and Discord, and
      check opengraph.xyz. Messengers cache a preview per URL, so test with `?v=2` after a change
- [x] Docs: `CLAUDE.md` (structure, `ui/`, `/styleguide`, the static assets), README,
      `.claude/docs/project-structure.md`

##### 9b — what was built, and where it differs from the plan above (2026-09-27)

Everything above is in the code; these are the calls made while building it. The plan's text is
left as written, so read this list as the correction.

- **`<html lang>` is rendered `de`, not `en`.** The plan said the server renders `en`, but the
  server's HTML is German: `loadLocale()` returns `de` without localStorage. `app.html` now says
  `lang="%lang%"` and `hooks.server.ts` fills it with `de`, or `en` under `/admin` (English-only).
  The root layout's `$effect` then sets the language shown. The link-preview text stays English
  as planned (`og:locale=en_US`), because it is written for a share into any chat, not a
  translation of the page
- **Reduced motion is a fade of ≤ 120 ms, not duration 0.** The token table says "opacity only,
  ≤ 120 ms", which is kinder than a jump cut and still honours the setting. `$lib/motion` turns
  fly, slide and scale into that fade (`reducedTransition()`, unit-tested with `cubicBezier()`)
- **The focus ring is an `outline`** (`focus-ring` utility: 2 px `focus`, offset 2 px), not the
  board's stacked `box-shadow`. An outline sits on top of a glow instead of replacing it and
  follows the radius
- **One extra token, `--color-coin-rim`** (`#8a5a00`), which the table names under `score`
- **The header shows no wordmark on `/` yet.** The game screens still draw their own "Geekster"
  title until 9c (playing) and 9e (welcome, result), and two titles on one screen would look
  broken in a 9b release. `+layout.svelte` has `screenDrawsTitle` for it: **9c must switch it**
  to `phase !== 'welcome'` when it removes `GameScreen`'s `<h1>` and its PRO pill, and 9e to
  always-on-except-welcome. The PRO badge in `AppHeader` already follows a Pro run
- **`ModeChoice` is not rebuilt on `SegmentedControl` yet.** That restyles the welcome screen, which
  is 9e's. The primitive exists and has both states (gated, Pro chosen) on `/styleguide`
- **`brand:render` needs no `ws`:** Node 22's built-in `WebSocket` drives the DevTools protocol.
  It expects `npm run dev` to be running and reads the asset list from
  `/styleguide/brand/assets.json` (`src/lib/brand.ts`), retries a page whose font didn't load
  (Vite's first-request optimising can drop one), and refuses an OG image over 300 kB. The OG image
  came out at 84 kB as a palette PNG; the wordmark on it is 72 px, since 88 px ran into the cards
- **The OG image uses seed screenshots** from `static/screenshots/` (Super Mario 64, Half-Life 2 as
  the `????` card, The Last of Us), so rendering it needs no database
- **Measured:** `/styleguide` at 390 and 1280 px, no horizontal scroll (the 68 px wordmark scrolls
  inside its row on a phone); `/` looks as before apart from Exo 2 as the body face and the header;
  the switch sets `lang` to `en` and back, and it survives a reload. Only the six latin
  woff/woff2 pairs are emitted by the build (Dela Gothic One's is 14 kB)
- **Staging checked (2026-09-27, `203d335`, CI green):** `lang="de"`, all 19 description / `og:*` /
  `twitter:*` / `theme-color` tags, `og:image` absolute
  (`https://staging.geekster.pro/og-image.png`, 200, 86 kB PNG), the hashed Dela Gothic One
  preload, `favicon.ico`, `apple-touch-icon.png`, `site.webmanifest` (`application/manifest+json`)
  and `/styleguide/` with `robots: noindex`
- **Moved to the redesign's release (decision 9):** the release PR `develop` → `main`, and after
  it the messenger and opengraph.xyz checks on production (the "Verify" box above, left open)

#### 9c — The HUD (`develop`; built on `feature/redesign`, merged 2026-09-28)

**Scope:** the HUD and everything it reports, on the playing screen. The card, the timeline rows,
the slots, drag, the bonus panel and the reveal keep their look (9d); welcome and result keep
theirs (9e). The playing screen looks half-new until 9d, which staging may show (decision 10).
**Done when** every box is ticked, a Normal and a Pro run are played on the dev server through a
wrong placement and a streak of 10 (with a life missing and with lives full), reduced motion is
checked with the emulation on, and the branch preview builds.

- [x] **First commit, no visual change:** split `GameScreen.svelte` into `RunHud`,
      `StreakMeter`, `CurrentCard`, `Timeline` / `TimelineRow` and `FeedbackToast`, plus
      `src/lib/dragPlace.svelte.ts` for the HTML5 and touch drag logic (long-press, auto-scroll,
      `findSlotUnderPoint`). Verified by playing a run on the dev server before anything is
      restyled
- [x] `streakMeter()` in `placement.ts` with Vitest cases: 0, 1, 7, 10, 11, 20; lives full and
      not full; multiplier at 0, 1, 5 and 6
- [x] `StreakMeter` and the hearts per the spec above, including the regain and break animations
      (through `motion.ts`). `heart-pop` in `app.css` still glows red (`rgb(239 68 68)`): move it
      to `--color-life`
- [x] `RunHud` on a `Surface` with the magenta frame (red for the wrong moment), fixed-width, with
      a `compact` prop for the one-line layout. 9d wires `compact` to dragging and the header
      collapse to the bonus keyboard; 9c only builds both and shows them on `/styleguide`
- [x] The currency: its icon, and `hud.rupees` replaced by a key named for the currency, EN + DE.
      The score counts up to its new value (reduced motion: it jumps)
- [x] "Placed" leaves the HUD. The count becomes the timeline's heading ("Your timeline · 13")
- [x] The toast replaces the fixed banner: announced politely, placed so it doesn't cover the HUD,
      2.5 s instead of 5
- [x] The Pro badge moves into the app header: delete `GameScreen`'s PRO pill and `<h1>`, and
      replace `screenDrawsTitle` in `+layout.svelte` (today `pathname === '/'`) with
      `pathname === '/' && gameState.phase === 'welcome'`: the welcome screen keeps its own title
      until 9e, the result screen has none (its headline is "Game over" etc.)
- [x] Remove the strings that lose their use (`hud.placed`, `hud.livesFull`, `hud.streak`,
      `hud.rupees`) and add the new ones in EN + DE; tick the boxes here and add a "9c — what was
      built" list like 9b's for anything that differs from this plan

##### 9c — what was built, and where it differs from the plan above (2026-09-28)

- **The split** (`f993541`, no visual change): `RunHud`, `StreakMeter`, `CurrentCard`,
  `Timeline` / `TimelineRow`, `FeedbackToast`, and the `DragPlace` class in
  `src/lib/dragPlace.svelte.ts`. `GameScreen` creates one `DragPlace` and hands it to the card
  and the timeline. It went from 563 to ~230 lines, most of them the bonus panel and the reveal, which
  are 9d's. Checked before anything was restyled: a run played with a wrong placement looked as
  before, and a touch long-press drag still placed a card
- **One more pure function than planned: `hudMoment(placementCorrect, streak, lifeRegained)`**
  in `placement.ts` (`wrong` / `lifeBack` / `tenInARow` / `none`, unit-tested). It drives the
  HUD's frame, the heart that breaks or returns, the bar's flash or drain, and the toast's tone.
  **The moment is derived from state, not a timer:** it lasts from the placement to "Next card"
  (`GameScreen` passes `null` once `lastPlacedGameId` is cleared). Only the toast has a timer
  (2.5 s, in `FeedbackToast`)
- **The caption with lives full** reads "In a row, up to ×1.5", or "Max multiplier" from ×1.5.
  The spec said "the multiplier status". "Next card ×1.2" was tried and dropped, because it only
  repeated the chip
- **`hud.livesFull` became `hud.livesFullSpoken`**, used only in the bar's `aria-label`
  ("Streak 7, multiplier ×1.5, all lives full"). On screen, lives full is the absence of the
  socket. Removed as planned: `hud.placed`, `hud.streak`, `hud.rupees`. Removed as well:
  `hud.life`, `hud.nextLife` and the banner's `game.correct` / `game.wrong` /
  `game.livesRemaining` / `game.noLivesLeft` / `game.lifeRegained`. New: `hud.*` (label, lives,
  streakCount, toNextLife, plusLife, multiplierUpTo, meterLabel, credits, creditsShort),
  `toast.*` and `timeline.heading`
- **Numbers follow the shown language:** `formatNumber()` / `formatMultiplier()` in
  `i18n.svelte.ts`, so German reads `2.340 CR` and `×1,5`. The old HUD used the browser's
  locale
- **The wrong toast names the answer** ("Portal is from 2007 · −1 life"), as on the board. The
  correct toast says "+100 · streak N": only the placement's points are known before the bonus
- **The life-back arc goes around the score**, not through it. The board's arc crossed the credits,
  and 9a's rule is that decoration never runs through text. It leaves the box to the right of the
  score, runs just above the HUD's top edge and drops into the returning heart, drawn right to
  left (`arc-travel`, whose clip reaches 12 px outside the box). The SVG is measured
  (`bind:clientWidth`), since a positioned SVG doesn't stretch between `left` and `right`
- **The heart socket's box stays when the socket is gone**, so the bar is the same width in
  every state (U2)
- **Added to the primitives:** `Heart` `broken`; `Surface` frames `danger-glow` and `life-glow`
  (the HUD's moments; `danger` keeps its own fill, these keep the tone's); tokens
  `--shadow-glow-danger`, `--shadow-glow-life`, `--shadow-glow-segment`; keyframes
  `heart-fade`, `heart-break`, `bar-flash`, `arc-travel`, and `heart-pop` now glows in
  `--color-life`; `countUpDuration()` in `$lib/motion` (`DURATION.reveal`, or 0 with reduced
  motion); `PLACEMENT_POINTS` and `MAX_STREAK_MULTIPLIER` in `scoring.ts`. **Off segments are
  `accent-soft`**: the board's `#0f3440` isn't a token
- **The header collapse is `AppHeader`'s `score` prop**: the score takes the language switch's
  place. `/styleguide` shows it with the Pro badge. `RunHud`'s `compact` layout and every HUD state
  are there too, plus a live HUD played with `applyPlacement()` (Correct / Wrong / Streak 9 /
  Compact). **9d wires both:** `compact` to `drag.isDragging`, `score` to the bonus panel with
  the keyboard open
- **Until 9d's two columns, the HUD and the toast take the card's width** (`max-w-2xl`, centred). At
  1280 px they ran edge to edge
- **The result screen now shows the header wordmark**, without the header's PRO badge
  (`proRun` is playing-only). Its own PRO pill and headline stay until 9e
- **Transitions:** `CurrentCard` and `GameScreen` import `fly` from `$lib/motion` now.
  **`ScoreReveal`, `GameCard` and `BonusGuessPanel` still use `svelte/transition` directly**, so
  under reduced motion the bonus panel still flies in. They are 9d's components
- **Verified on the dev server with headless Brave (2026-09-28):** a Normal and a Pro run each
  played through a wrong placement, then 10 in a row with a life missing (pink frame, heart pop,
  arc, "10 in a row · +1 life won back"), then 20 at full lives ("Lives already full · ×1.5
  holds", no life). The drain sweeps right to left and the chip drops to ×1.0. With
  `prefers-reduced-motion` emulated, the only HUD keyframe that runs is `heart-fade`: no break,
  flash or arc, and the credits jump (0 → 100 at once, against ~900 ms counting up without it).
  German, 320 px (no horizontal scroll), 1280 px, the touch long-press drag and an HTML5
  drag-and-drop all checked. `/styleguide` at 390 and 1280 px
- **Branch preview checked (2026-09-28, `d7737a1`):** Vercel built it
  (`geekster-git-feature-redesign-kaiserlikes-projects.vercel.app`, behind Vercel
  Authentication), and a card played there against the staging database showed the new HUD and
  the toast. CI doesn't run on a `feature/*` push (only on PRs and on `main` / `develop`), so
  lint, format, check, test and build were run locally before the push, all green
- **Playing Pro locally** needs Pro primaries in `local.db` and the gate lowered. This session
  copied 40 Normal primaries as `difficulty = 'pro'` rows (local file only), and started
  `npm run dev` with `PRO_MIN_POOL_OVERRIDE=5` in the shell's environment rather than in `.env`

#### 9d — The playing screen (`develop`)

**Scope:** everything on the playing screen below the HUD: the card to place, the timeline rows
and slots, drag, the wrong-placement feedback, the bonus panel, the reveal, and the desktop
layout. Welcome and result keep their look (9e). **Done when** every box is ticked, a Normal
and a Pro run are played on the dev server at 390 and 1280 px through a correct placement with a
bonus guess, a wrong one and a timeline past `COMPACT_TIMELINE_AT`, reduced motion is checked
with the emulation on, and the slice is pushed to `develop` and checked on staging (decision 10).
If it runs long, the bonus panel and the reveal can go into their own session (see "Delivery
order").

- [x] **Wire up what 9c built:** `RunHud`'s `compact` to `drag.isDragging`, and `AppHeader`'s
      `score` while the bonus panel has the keyboard open (the HUD collapses into the header;
      `+layout.svelte` renders the header, so it needs to know). Both states are on `/styleguide`
- [x] **Transitions through `$lib/motion`:** `ScoreReveal`, `GameCard` and `BonusGuessPanel` still
      import from `svelte/transition`, so the bonus panel still flies in with reduced motion.
      After 9d, `grep -rn "svelte/transition" src/lib/components/*.svelte` comes back empty
- [x] **Timeline rows year-first:** the year large on the left, the name, a small thumbnail (as in
      all four drafts). Check `COMPACT_TIMELINE_AT` (12) again: with ~64 px rows the thumbnails may
      be able to stay for longer, and the card just placed stays full-size for its reveal as
      today
- [x] **Slots:** "Place here" between rows, 44 px high, the drop target highlighted while
      dragging, and keyboard focus visible. The copy says tapping works ("Drag or tap a slot",
      U11)
- [x] **Current card:** it shrinks to a thumbnail strip while dragging and once the timeline has
      scrolled under it (U9). The year chip shows "????", never a partial year
- [x] **Wrong placement (U8):** a ghost at the slot the player chose, the card sliding to where it
      belongs, both on screen for a moment before the reveal
- [x] **Bonus panel (U12, U13):** `type="text"` with `inputmode="numeric"`, `pattern="[0-9]*"` and
      `maxlength=4` for the year. The placeholders go through i18n. Autofocus only where
      `(pointer: fine)` holds, so a phone opens its keyboard when the player taps, not at once.
      The timer is announced at 10 s and 5 s, never every second. It's still 30 s
- [x] **Reveal:** the answer card and the score breakdown in the new look. Each result keeps its
      text label ("Exact", "Close", "Nope") next to its colour and gets an icon. "Next game" also
      responds to Enter
- [x] **Desktop ≥ 1024 px:** two columns in a fixed `100dvh` shell. Only the timeline pane
      scrolls (9a's design call "Desktop with a long timeline")
- [x] **Decade ruler** (`DecadeRuler.svelte`) fed by a pure, unit-tested
      `decadeBuckets(timeline)` in `placement.ts` (decade, count, index of its first card).
      Buttons with `aria-label` "1990s, 8 cards", `aria-current` on the one in view (an
      `IntersectionObserver` on the decade labels), click scrolls, hover while dragging scrolls
- [x] **Pinned decade labels** in the timeline (`position: sticky` inside the pane)
- [x] **Drag auto-scroll in the pane** on desktop (HTML5 `dragover` near the edges), sharing the
      speed curve with the existing touch auto-scroll in `dragPlace.svelte.ts`
- [x] **No scroll that leaks the answer:** the pane keeps its position between cards. It scrolls
      only on reveal, to the placed card (and on a miss to its ghost too). Checked by playing a
      run and watching the pane between cards
- [x] Phone: try the decade ruler as a narrow strip on the right edge. Keep it only if it doesn't
      crowd the rows, and record the decision here. **Decided: no ruler on a phone** (below)

##### 9d — what was built, and where it differs from the plan above (2026-09-28)

> **Superseded the same day: one column on every screen (decision 11, user, 2026-09-28).** The
> two-column desktop felt unintuitive to the user: the card and where it goes sat side by side,
> the eye jumping left and right, and a short timeline left half the screen empty. Switching
> layouts at N cards or at "the timeline scrolls" was considered and rejected: it would move the
> card and the HUD mid-run, at a moment that depends on the window height. So a desktop now gets
> the phone's model, larger:
>
> - one column within 880 px (the header aligned to it), the page scrolls; the card's width is
>   also capped by the window height, `(100dvh − 26rem) · 16/9` (876 px at 2000 × 945, 679 px at
>   1280 × 800), so the first slot is in view
> - once the card has scrolled off, **a bar pinned to the top** with the compact HUD and the
>   card's strip (draggable) — on every screen, the phone included. While dragging the card
>   shrinks to the strip and the HUD goes compact, on every screen
> - **the decade ruler** is `fixed` to the right of the column from 1280 px (`xl`), from 8 cards,
>   once the page scrolls and with two decades or more; a decade's first row scrolls to just
>   under the pinned bar (`scroll-mt-40`)
> - HTML5 drag auto-scrolls the page (a window `dragover`, the 150 px zone of touch); the cue
>   sits at the viewport's edge
> - **user review of that (2026-09-28):** every pressable element now shows the pointer — a
>   base rule in `app.css`, since Tailwind v4's preflight gives `button` `cursor: default` — and
>   the hovers are visible: the primary button brightens and glows more, secondary and icon
>   buttons fill `accent-soft`, ruler buttons fill too. **The ruler is the timeline in
>   miniature:** each decade's button takes its share of the timeline's measured height (label to
>   the next label), not of the card count, so it lines up with what the page shows. **The decade
>   in view** is the one of the first row whose middle is below the pinned bar; **a decade picked
>   on the ruler stays picked** while one of its rows is on screen, until the player scrolls
>   themselves (wheel, touch, key) — near the page's end the scroll can't bring its first row to
>   the top, so the old "first row passed the top" rule lit the decade above
> - **second review (2026-09-28):** the toast **floats over the top-left corner** (`fixed`,
>   `pointer-events-none`, above the pinned bar, with a shadow) instead of sitting in the flow
>   under the HUD: its 2.5 s coming and going moved the bonus panel, so a tap meant for Skip or
>   a field could land on the wrong thing. It still is the polite live region (U7's point). And
>   **on a correct placement "Next card" is the answer card's last line**, arriving after "Round"
>   (a sixth step of the stagger); it takes focus when it appears, so Enter still works. On a
>   miss it stays pinned to the bottom, where the ghost may have scrolled the page
> - **third review, the user's idea (2026-09-28): no toast; the card turns into its verdict.**
>   `PlacementResult.svelte`. After a correct placement the screenshot stays where the card was,
>   its frame takes the verdict's colour and an opaque panel scales in over it (✓ "Correct · +100 ·
>   streak N", ♥ pink for a life back, ★ for ten in a row with lives full) for 1 s
>   (`VERDICT_MS`; 0.7 s at first, 1 s after the user tried it), then the stage turns into the bonus round: the stage's height glides
>   (`transition-[height]` on a measured wrapper, 400 ms) while the verdict fades over the arriving
>   panel (both in one grid cell). **The verdict waits for the card to be in view** (a phone
>   scrolls to the top first; `whenAtTop()`, at most 1.2 s), and the bonus timer starts only when
>   the fields are there. A tap on the verdict skips to the bonus round. **A miss** shows the
>   verdict as one red line (thumbnail, ✗, "Wrong · Portal is from 2007 · −1 life"),
>   `sticky top-2`, so it stays in view while the page scrolls to the ghost; that scroll waits for
>   the stage's glide (else it measured stale positions) and centres the pair below the pinned
>   line. The words are spoken by a `sr-only` polite live region in `GameScreen`.
>   `FeedbackToast.svelte` is deleted; the `Toast` primitive stays for later use. Reduced motion:
>   no scale, no glide, the fades are ≤ 120 ms
> - gone: the `100dvh` shell in `+layout.svelte`, the timeline pane and `drag.setPane()`, the
>   pinned heading and pinned decade labels (the labels stay, in the flow), the fluid two-column
>   grid, the desktop "mid-drag" hint. The page scrolls to the top for the bonus panel, the answer
>   card and the next card on every screen
>
> Everything below that mentions the pane, the shell, the left column or the pinned labels
> describes the two-column version and is kept as history. The lightbox stays.

- **Layout.** `GameScreen` is one flex column on a phone and, from `lg` (1024 px), a grid
  `440px | 1fr` with rows HUD · toast · stage · actions on the left and the timeline spanning them
  on the right. `+layout.svelte` makes the page a `lg:h-dvh` shell with `overflow: hidden` only
  while `phase === 'playing'`, so welcome and result still scroll. The "stage" is the card to
  place, the bonus panel or the answer card, one at a time, where the card was
- **"Next card" is pinned to the bottom of a phone** (`sticky bottom-0`) during a reveal, on both
  boards. On a miss the page scrolls to the ghost, often far from the top, and a button under the
  answer card would be off screen. It takes focus when the reveal starts, which is how Enter works
  (plus Space, as on any button); a 300 ms guard stops the Enter that submitted the guess from
  also skipping the reveal. On desktop it sits under the answer card in the left column
- **A miss shows no answer card** (as on `M3RevealWrong`): the toast, the ghost and the red
  "Belongs here" row say it all, and the round's points are 0. The ghost's slot comes from the pure
  `ghostSlotIndex(chosenSlot, insertedAt)`; the row slides from the ghost to its place with the Web
  Animations API (900 ms after a 400 ms pause), on the row inside the `li`, so the reveal's scroll
  measures the `li` where it stays. Reduced motion: no slide
- **The reveal's scroll** (`Timeline.revealInView()`): nothing moves if the card (and ghost) are
  already in view; else the pair is centred, or — when a far miss doesn't fit both — the scroll
  follows the card to where it belongs. On a phone a correct placement scrolls to the top instead
  (the bonus panel, then the answer card); "Next card" goes to the top too. Checked: between cards
  the pane's content stays put (browser scroll anchoring adjusts `scrollTop` when slots return
  above the view; nothing on screen moves)
- **`COMPACT_TIMELINE_AT` is 20 now and lives in `Timeline.svelte`.** A year-first row with its
  thumbnail is ~64 px, a compact one 40, so on a phone the saving is only ~25 % per card and the
  thumbnails earn their place longer. The result screen keeps `GameCard` with its own
  `COMPACT_RESULT_AT = 12` until 9e restyles it. Rows no longer collapse while dragging (9c did
  that); the slots grow to 60 px instead, and in a compact timeline only the drop target grows
  (52 px) — 60 px for every slot doubled a 25-card list mid-drag
- **The card just placed during the bonus guess** shows `????` and "Just placed" in place of its
  year and name, since the name is the other half of the question. Revealed, it's framed
  turquoise; missed, red
- **Slots have an accessible name that starts with the visible text:** "Place here, between Super
  Mario 64 (1996) and Kingdom Hearts (2002)" (WCAG 2.5.3), so a screen-reader or keyboard player
  knows where each slot is. The card's hint says tapping works (U11): "Drag it onto a slot, or tap
  one." on a coarse pointer, "… or click one. Keyboard: Tab to a slot, Enter to place." on a fine
  one (Tailwind's `pointer-coarse:` / `pointer-fine:`). Mid-drag on desktop the hint points at the
  pane's edges and the ruler (`M3DeskLong`)
- **The phone strip** (U9): while dragging, the in-flow card turns into the `M3Drag` strip, unless
  it has already scrolled off, where shrinking would move the slots under the finger. Once it has
  scrolled off (an `IntersectionObserver`), a strip is pinned to the top, and it can be dragged
  too; a touch on it keeps it mounted until the finger lifts, because a touch whose target leaves
  the DOM stops reaching the window's `touchmove` listener. Parts are hidden with CSS, never
  unmounted, for the same reason. The floating card is the board's: 150 px, tilted −4°, magenta
  glow. Desktop keeps the card in place as a dashed placeholder at 30 % while dragging
- **The HUD's two states are wired:** `compact` = dragging on a phone (desktop keeps the full HUD,
  as on `M3DeskLong`); the header collapse = a bonus field has focus on a coarse pointer (the phone
  keyboard is up) — the HUD unmounts and `AppHeader` gets `score` through `headerScore`
  (`src/lib/headerScore.svelte.ts`, module state written only from an effect, so the server
  renders null)
- **Bonus panel:** the M3 panel on `Surface` magenta with `TextField`s. The year is `type="text"`,
  `inputmode="numeric"`, `pattern="[0-9]*"`, `maxlength=4`, and only 1–4 digits count as a guess.
  Autofocus only on `(pointer: fine)`. The seconds are silent (`aria-hidden`); a polite `sr-only`
  region says "10 seconds left" and "5 seconds left"; from 5 s the count and the bar turn `danger`.
  The "Correct placement!" line is gone (the toast says it) and so is the `placementCorrect` prop.
  The hint "Up to +50 for the year, +50 for the name" reads `MAX_YEAR_BONUS` / `MAX_NAME_BONUS`,
  now exported from `scoring.ts`. At 320 px in German "Überspringen" doesn't fit beside
  "Aufdecken", so the button row wraps. `TextField`'s input got `w-full min-w-0` (it overflowed a
  grid cell)
- **Answer card** (`ScoreReveal`, which now includes the answer): the 21:9 screenshot, name, year
  in the display face with the split, then Placement / Year / Name / Streak / Round, staggered as
  before. Verdicts are ✓ exact, ~ close (some points), ✗ nope, — skipped, always beside the word
- **Decade ruler and pinned labels** (desktop): `decadeBuckets()` in `placement.ts`; the ruler
  shows only once the pane overflows and holds two decades or more: on staging a two-card
  timeline stretched it into two buttons of 400 px each, an overview of nothing. The decade in view
  is computed on the pane's scroll (rAF-throttled `getBoundingClientRect` of each decade's first
  row against the pinned heading) rather than an `IntersectionObserver`: "which one has passed
  the top" is one comparison, and a sticky label's own position can't be used. The heading
  "Your timeline · N · oldest at the top" is pinned at the pane's top (36 px) and the decade
  labels under it (`top-9`); a decade's first row has `scroll-mt-[72px]`, which is what the ruler
  and a mid-drag hover scroll to. On a phone the labels are shown, not pinned
- **No decade ruler on a phone** (decision): at 390 px the row is 358 wide; a 44 px ruler and its
  gap leave ~300, and after the 58 px year and the 92 px thumbnail the name gets ~110 px — two
  lines for most titles. The phone has page scroll with its 150 px auto-scroll zone instead
- **Button** got a bindable `ref` (for the focus on "Next card"). `/styleguide` has two new
  sections: slots, rows, the ghost and the ruler; and a live bonus panel beside two answer cards
- **Strings:** new `card.*`, `timeline.*` (oldestFirst, decade, decadeShort, justPlaced,
  youPutItHere, belongsHere, scrolling, ruler, rulerDecade), `slot.first/between/last`,
  `bonus.round/seconds/secondsLeft/yearPlaceholder/namePlaceholder/hint`,
  `score.exact/close/nope/offBy/streak/round`. Removed: `game.dropOnSlot`,
  `game.placeInTimeline`, `game.yearGuess`, `game.nameGuess`, `game.exact`, `game.close`,
  `game.nope`, `game.offByYears`, `bonus.correctPlacement`, `bonus.wrongPlacement`,
  `bonus.bonusGuess`, `score.guessed`, `score.actual`, `score.streakBonus`, `score.roundTotal`.
  "Next Game" reads "Next card"
- **User feedback on desktop (2026-09-28), fixed the same day.** At 2000 × 945 the 440 px left
  column left the card at ~345 px and half the screen empty. Now:
  - **fluid columns**: left `min(50%, (100dvh − 24rem) · 16/9)` — half the width, or less when
    the window is too short for a 16:9 card that wide under the HUD — and the timeline the rest,
    the whole grid within 1760 px and centred, the header aligned to it. Measured: 880 / 832 px
    at 2000 × 945 (card 876 × 493), 600 / 552 at 1280 × 800, 680 / 632 at 1440 × 900. The 440 px
    column and the 680 px timeline of the 9a boards are superseded
  - the answer card's image is capped at `min(26dvh, 100dvh − 41rem)`, so the answer, a toast
    and "Next card" fit even at 1280 × 720 (the image becomes a strip there); the stage cell can
    scroll as a last resort, padded so the card's glow isn't clipped
  - **a lightbox for the card to place** (`ui/Lightbox.svelte`, bits-ui's dialog like the admin
    panel's `ImageLightbox`, in the tokens): a click on the image or its ⤢ button opens it at
    16:9, as large as the screen allows (`min(94vw, 88dvh · 16/9)`; a 320 px seed shot is scaled
    up), with the `????` chip, a Close button that takes focus, Escape and a click beside it. A
    click within 400 ms of a drag ending opens nothing, so a let-go long-press doesn't. Checked:
    mouse click, button, Escape, a phone tap (opens) and a long-press drag let go (doesn't)
- **Staging checked (2026-09-28, `86dcac1`, CI green):** a card played on staging.geekster.pro
  (access link) at 390 and 1280 px against the staging database: the miss's ghost and "Belongs
  here", the fixed shell (`overflow: hidden`), the new HUD and toast. The ruler fix above came
  out of it
- **Verified on the dev server with headless Brave (2026-09-28)**, drivers in `scratchpad/cdp/`
  (`run9d.mjs`, `drag9d.mjs`, `touch9d.mjs`, `kb9d.mjs`, `keys9d.mjs`, `leak9d.mjs`,
  `shotnow.mjs`, `sg9d.mjs`; `play.mjs` places N cards): Normal at 390 and 1280 through a bonus
  guess (year one off, name exact → ✓ ~ ✓), a miss and 25 cards (compact rows, ruler, pinned
  labels); Pro at 1280 with the PRO badge; a far miss at both widths (the scroll follows the card);
  German at 320 (no horizontal scroll after the button fix); reduced motion (only opacity
  animations run); a touch long-press drag with the strip, the compact HUD and the floating card;
  the header collapse on a focused field with touch emulation, and the 10 s / 5 s announcements;
  HTML5 drag at 1280 onto the pane's edge (cue and scroll), a ruler hover mid-drag, and a drop;
  a whole placement by keyboard (Tab to a named slot, Enter, Enter, Enter). **Two harness notes:**
  a headless tab fires no focus events without `Emulation.setFocusEmulationEnabled`, and CDP's
  `dispatchDragEvent` didn't deliver `dragOver` at the pane's middle, so the stop-scrolling path
  was exercised with an in-page `DragEvent`

#### 9e — Welcome, result, leaderboard (`develop`)

- [x] **Welcome (U14):** the wordmark, a one-line pitch, the mode choice, and Play as the one
      dominant action. The six rules go behind "How to play" (a disclosure or a dialog). First-run
      help as asked at the slice start, remembered in `localStorage` (a new key, documented next
      to `geekster-mode`)
- [x] **Mode choice** on `SegmentedControl`. Pro "Coming soon" keeps its locked state and its
      note
- [x] **Result (U15, U16):** the headline, the score and the stats first, then **Play Again and
      Main Menu directly under them** (above the fold, so no sticky bar: see 9a's design calls), then the
      leaderboard, then the timeline with the misses marked
- [x] **Leaderboard** tabs restyled, with empty and loading states
- [x] Loading and error states on the welcome screen (the error with its retry, as today)
- [x] Pushed to `develop` and checked on staging (`c4717e9`, CI green, 2026-09-28: the whole
      flow at 390 px against the staging database, via an access link)

##### 9e — what was built, and where it differs from the plan above (2026-09-28)

- **First-run help is a coach mark** (the user's choice at the slice start, over a 3-step
  overlay). `CoachMark.svelte` sits in the flow between the card to place and the timeline, a
  turquoise callout with a notch pointing down at the slots: "Your first card · Portal is from 2007. Is this card older? Put it above. Newer? Below." The card's own hint (drag, tap/click,
  keys) stays under the card, so the callout only adds the ordering rule. It goes with the first
  placement or its ✕, both writing `localStorage['geekster-coach-seen'] = '1'`
  (`src/lib/firstRun.ts`). **A browser with a finished run counts as having seen it**
  (`hasPlayedBefore()` in `leaderboard.ts`: any Normal, Pro or Classic entry), so players from
  before 9e never get it; blocked storage shows it never (it would come back every run). In the
  flow rather than floating, so it never covers a slot
- **Welcome.** First visit: the 44 px wordmark with the tagline (68 px from `lg`), the pitch as
  the `h1` in the display face ("Put video games in order."), one sentence of rules, the mode
  choice, START RUN (`Button lg`), "How to play ▸". **Returning** (a finished run in this
  browser): "Welcome back. Your best: N CR" (the chosen mode's best; without one, just the
  greeting), the pitch as an `sr-only` `h1`, and the leaderboard (5 rows) between START RUN and
  "How to play", as on `M3Returning`. Desktop is two columns (`M3DeskWelcome`): the left one as on
  the phone with the mode choice and START RUN side by side; the right one the leaderboard for a
  returning player, or for a first visit a decorative tilted timeline (three seed rows and a
  `????` card, `aria-hidden` and `inert`). The header widens to the welcome screen's 1120 px
  there (`AppHeader wide`), so the language switch lines up
- **The horizon grid never shows through text:** it isn't layered behind the content (the boards
  put it behind "How to play") but takes the space the content leaves at the bottom of the
  screen, at least 96 px, `flex-1`. Opening "How to play" pushes it down
- **"How to play"** is a disclosure (`HowToPlay.svelte`, a button with `aria-expanded` and the
  six rules in a `Surface`-style list, `slide` from `$lib/motion`), not a dialog: the rules are
  short and a dialog would hide the Start button they lead to
- **Mode choice** is `SegmentedControl` (`ModeChoice.svelte` is now a thin wrapper): Pro pink,
  locked with the `COMING SOON` badge and `aria-describedby` on its note, which now sits in the
  same line as the mode hint
- **Loading and error:** START RUN shows `Button`'s spinner and "Loading"; the error is the
  `M3States` box (`Surface frame="danger"`, ✗ + the title, the message, `role="alert"`) above the
  mode choice, and the button reads "Try again". Checked by failing `/api/games/random` in the
  page
- **Result** (`M3Result`, `M3Perfect`): the mode chip (Normal turquoise, Pro pink), the headline
  in the display face with the split and a glow by outcome (Game over red, Pool cleared
  turquoise, Perfect run gold), the pool-cleared hint, the score (40 px, gold), "New personal
  best" when the run tops an earlier one or "#N of your runs", four stats (Placed, Misses red
  when > 0, Best streak, ♥ Back; short labels on screen, the full names for a screen reader),
  then **Play again / Menu** — above the fold at 390 × 844 after any run. A perfect run gets the
  striped sun on a horizon between the actions and the board. Then the leaderboard (this device /
  global) and "Your timeline · N": compact `TimelineRow`s, the misses with the new `missed`
  status (red frame, red year, ✗ with an `sr-only` "misplaced"), a legend "✗ = misplaced", 14
  rows and "+ N more" (all of them when only one would be hidden). **Misses are recorded as they
  happen:** `GameState.missedIds`, pushed by `placeGame()`; `roundScores` is in placement order
  and has no game id. `GameCard.svelte` and `COMPACT_RESULT_AT` are deleted
- **Every phase starts at the top** (`+page.svelte`): a run ended wherever its timeline had
  scrolled to, and the result screen opened there (found at 1280 px)
- **Leaderboard** (`Leaderboard.svelte`, rewritten): a `Surface` with the magenta frame, ARIA tabs
  (arrow keys, Home, End, roving `tabindex`) "This device" / "Global" / "Classic" (only under
  Normal and when this browser has a classic list), rows of rank · score in CR · "23 placed ·
  26 Sep" with a `NEW` chip on the run just finished (always shown, whatever its rank) and a
  `PERFECT` / `CLEARED` chip. The global list is fetched per mode on first view and kept per mode
  (the old one fetched once and showed Normal's list after switching to Pro). Empty: the dashed
  box "No runs yet. Your first one lands here."; loading: three opaque skeleton rows,
  `motion-safe:animate-pulse`; failed: "Global leaderboard unavailable". The player column is gone
  (every name is "Anonymous" until Sprint 10), and so is the streak column
- **`formatShortDate()`** in `i18n.svelte.ts` ("26 Sept", "26. Sept."), which also reads SQLite's
  `2026-09-20 19:10:33` as UTC (Safari won't parse it as it is)
- **Strings:** new `welcome.pitch/pitchDetail/back/yourBest`, `coach.*`,
  `result.personalBest/rank/bestShort/livesBackShort/missed/missedLegend/more`,
  `leaderboard.new/placedCount/empty/loading`; `result.yourTimeline` takes the count. Changed:
  START RUN / "Run starten", "Play again" / "Nochmal", "Menu" / "Menü", "Misses", "This device" /
  "Gerät". Removed: `welcome.subtitle`, `welcome.topScores*`, `result.points`,
  `leaderboard.score/result/streak/date/placed/player`
- **`/styleguide`** has a section for ModeChoice (gated), HowToPlay, CoachMark and the
  Leaderboard (with a NEW row, and empty); `TimelineRow`'s list shows `missed`
- **Verified on the dev server with headless Brave (2026-09-28)**, drivers `scratchpad/cdp/e9*.mjs`:
  a first visit → How to play → a run with the coach mark (gone and the key written after the
  first placement; ✕ dismisses; a second run has none) → R R W R W W → the result with 3 misses
  marked → Global tab (skeleton, then the list) → Menu → returning welcome, at 390 and 1280 px in
  English and at 390 in German; the coach mark with touch emulation in German; the gated Pro
  choice with a stored Pro (plays Normal, the note is the radio's description); a perfect run on
  a 4-game pool (fetch cut in the page); the loading and error states. No horizontal overflow
  anywhere. **Left for 9f:** a returning player's welcome is server-rendered as a first visit and
  swaps after hydration (the choice lives in localStorage); measure its CLS there

#### 9f — Quality pass and admin tokens (`develop`)

- [x] Lighthouse, mobile, on `/` and on a result screen: Accessibility 100, Best Practices ≥ 95,
      SEO ≥ 95, Performance ≥ 90. CLS < 0.1 (screenshots keep their `aspect-ratio` box). On `/`
      (production build, `vite preview`): 95 / 100 / 100 / 100, CLS 0. The result screen is not
      a URL Lighthouse can load (it needs a played run), so it got axe and a CLS measurement instead
- [x] axe-core on every phase, driven by headless Brave over CDP, the way
      Sprint 8 slice 1 was verified
- [x] A whole run by keyboard only; one run with reduced motion on; 320 px wide with no
      horizontal scroll. **Not done by Claude:** VoiceOver on iOS (a hand step, below) and a
      real 200 % browser zoom (1280 px at 200 % lays out as 640 px, between the 390 and the
      1280 px checks, both clean)
- [x] **Admin gets the tokens only:** the body font, and the brand accent where the admin uses
      purple today. Its layout and its green `NORMAL` / blue `PRO` / amber `DRAFT` / red
      `NO SCREENSHOT` semantics stay as they are
- [x] Docs: `CLAUDE.md` § Game Logic (the HUD), `.claude/docs/game-architecture.md`, README
- [x] Pushed to `develop` and checked on staging (`2c249d0`, CI green, 2026-09-28: `axe9f.mjs`
      played a run through all eleven states at 390 px against the staging database, via an
      access link: 0 violations). The release waits for 9g
- [ ] **Hand step (the user):** VoiceOver on an iPhone through one round: start, place a card
      (a slot's name says where it is), hear the verdict, the bonus round's 10 s / 5 s, the
      answer card, "Next card"

##### 9f — what was built (2026-09-28)

The user's brief: accessibility counts, but only the low-hanging fruit; and check that the
redesign's back-and-forth left clean code, not spaghetti. A read-only review of every game
component went first; its findings are below with what came of them.

- **Measured.** axe-core 4.13 (WCAG 2.0/2.1/2.2 A + AA and best practice) on eleven states: the
  first-visit welcome, "How to play" open, the first card with the coach mark, the verdict on the
  card, the bonus panel, the answer card, a miss with its ghost, the result, its Global tab, the
  returning welcome and the admin login, at 390, 1280 and 320 px. **No colour-contrast finding
  in the game.** What it found, all fixed: no `<main>` landmark, no `h1` while playing, and
  12 px `gray-500` links on `gray-900` in the admin (3.7:1). Now 0 violations everywhere.
  Lighthouse mobile on `/`: 95 / 100 / 100 / 100, CLS 0, LCP 2.7 s (the display font)
- **CLS of a returning player's welcome** (left over from 9e): 0.108 at 1280 px, because the
  server renders a first visit and the board replaces the decoration after hydration, moving the
  left column. The right column now keeps the decoration's height (484 px, as tall as a five-row
  board): 0.03. At 390 px it was 0 already
- **Landmarks and focus.** The game's content is in `<main>` (root layout), the admin login has
  its own. Every phase has one `h1` (the playing screen an `sr-only` "Your run"). **On a phase
  change focus moves to the new screen's `h1`** (`tabindex="-1"`, `+page.svelte`): after START
  RUN, "Result" and "Menu" the pressed button is gone and focus fell back to `<body>`, where a
  screen reader says nothing
- **Keyboard only** (1280 px, Tab / Enter): START RUN → Tab to a named slot → Enter → the bonus
  field has focus → Tab to Skip → "Next card" takes focus once the breakdown is in → a miss →
  game over → focus on "Game Over" → Tab to "Play again" → a new run. Every stop showed the
  focus ring. **Reduced motion:** sampled `document.getAnimations()` through a run: only colour,
  border, shadow and opacity change; with motion on, transform, height and scale do as well
- **The footer** was `text-gray-700` at 10 px (about 1.9:1): now `ink-subtle` at 12 px, the link
  with the focus ring. 9g redoes the footer; this is only its contrast
- **Admin:** `font-body`, and every `purple-*` became the accent: buttons and the active nav item
  `bg-accent text-on-accent` (white on turquoise would fail), links and focus borders `accent`,
  the ready-to-upload box and the selected filter `accent-soft`. `gray-*`, the status colours and
  the layout are unchanged. The `View the game` / `Log out` / `Back to the game` links went from
  `gray-500` to `gray-400`
- **A bug the review found:** during the correct verdict (1 s, plus the phone's scroll) the
  timeline row of the card just placed showed its name and year, the bonus round's question.
  `Timeline` hid it only while `bonusGuessing`. It's `????` now until the reveal
- **One round stage.** `GameScreen` held `verdictStage`, `bonusGuessing` and `bonusRevealing`
  (plus `verdictShown`), combined with guards like `verdict && lastPlacementCorrect === false`;
  some combinations were meaningless and the bug above lived in one. Now one
  `stage: RoundStage` (`card | verdict | bonus | reveal`, `types.ts`), which `Timeline` takes too
- **The toast is gone for good:** `ui/Toast.svelte` (unused by the game since 9d) and its
  styleguide section are deleted; `ToastMessage` is `PlacementVerdict`, `placementToast()` is
  `placementVerdict()` (and uses the derived `moment` instead of computing it again), the
  `toast.*` strings are `verdict.*`
- **The ruler's controller out of `Timeline`.** ~110 of `Timeline`'s 329 lines were the ruler's:
  when it shows, the decade in view, each decade's height, the jump, five window listeners, and an
  effect that re-ran itself (it set `pageOverflows`, which changed `showRuler`, which it
  depended on). That is `DecadeRulerState` in `src/lib/decadeRuler.svelte.ts` now, re-measuring
  from a `ResizeObserver` on the list and the page instead of `tick()` after chosen props.
  `DecadeRuler.svelte` still only draws, so `/styleguide` keeps showing it standalone
- **Smaller:** `--container-run` (912 px) replaces the four copies of the column's width
  (`max-w-run`, and the ruler's `left`); `coach` is `$state` (it was a reassigned `$derived`); the
  two `headerScore` effects are one; `showSlots` lost a redundant `!bonusGuessing`; the ghost is
  `bg-danger-soft`; unused `clearLeaderboard()` and the `--text-shadow-split-glow` token are
  deleted; stale comments about the pane, the toast and the pinned labels are corrected
- **Left as they are** (the review's "could"): `Timeline` reading `[data-pinned-bar]` /
  `[data-verdict-strip]` from other components' DOM; primitive variants used only on the
  styleguide (`Button ghost`, `Surface raised/sunken`, `TextField hint/error`), which are the
  design system's; a few one-off `rgb(...)` glows; `EASE.inOut` duplicated as a string for the
  Web Animations API in `slideFromGhost`
- **Drivers** (gitignored, `scratchpad/cdp/`): `axe9f.mjs <width>` (axe on every phase; it reads
  axe-core from a local `npm pack axe-core`, path at the top), `kb9f.mjs [--reduced]` (the
  keyboard run, with the animation sampler), `cls9f.mjs <base> <width>`, `verdict9f.mjs` (the
  row stays hidden through the verdict), `admin9f.mjs` (screenshots with `PW=`). Lighthouse:
  `CHROME_PATH=<Brave> npx lighthouse http://localhost:4173/ --form-factor=mobile` against
  `npm run build && npm run preview`

#### 9g — Legal pages (`develop`, last)

- [x] **Ask first** (answered 2026-09-28): **Austrian law** (§ 5 ECG, § 25 MedienG). Operator
      Franz Dietrich, Heinrich von Kleist-Gasse 18/4, 2232 Deutsch-Wagram, Österreich,
      franzdietrich@gmx.at — in `src/lib/legal.ts`, the one place both pages read them from
- [x] `/impressum` (German, binding, plus an English translation) and `/privacy` (EN/DE). The
      privacy page covers Vercel hosting and its request logs, Turso (the global scores: a score,
      stats, a timestamp and the name "Anonymous"), Vercel Blob images, `localStorage` (every key
      listed), no cookies for players (the admin session cookie only), self-hosted fonts, no
      analytics yet. **The texts are the operator's responsibility**; Claude drafted them. Before
      the release, check them against the WKO templates or a lawyer
- [x] **Takedown:** rights holders write to the operator's address naming the game and the
      screenshot; it is removed **within 14 days** (`TAKEDOWN_DAYS`), on both pages
- [x] **Screenshot credit:** one global line, "Screenshots © their respective rights holders,
      source: RAWG.io", in the footer and on both pages. **Per-screenshot credit: Sprint 11**, with
      the encyclopedia's developer/publisher data (user decision 2026-09-28)
- [x] The footer: Impressum · Privacy, and the credit on its own line, `ink-muted` links on
      `ink-subtle` text at 12 px (U21). Both pages are indexable and in the new look
- [x] Docs: the routes in `CLAUDE.md` and README; `ROADMAP.md` § Cross-cutting marks the
      Impressum and the credit done
- [x] **The Sprint 9 release** (decision 10): PR #32 `develop` → `main` for 9b–9g, merged
      2026-09-28 (`557f7e4`), no migration; `develop` fast-forwarded to it. **Production checks
      (2026-09-28):** Vercel deployed `557f7e4` to production. `/`, `/impressum/`, `/privacy/`,
      `/styleguide/` (noindex) and `/admin/login/` answer 200; no `X-Robots-Tag` on production;
      `www` 308s to the apex. The favicons, app icons, manifest and `og-image.png` are served.
      The head carries the og/twitter tags with an absolute image URL, and the Dela Gothic
      preload; nothing is loaded from Google Fonts. `/api/games/random` answers 200 and `?difficulty=pro` 409 (still
      gated). Crawler user agents (facebookexternalhit, WhatsApp, Telegram, Twitterbot) get the
      page and the image. axe 0 on both legal pages and the welcome screen, EN/DE, 390/1280 px.
      A fresh first run shows the coach mark and the first card from Blob. opengraph.xyz
      answered 429 (rate limit), so the preview was checked by crawler user agent instead. **Left
      for the user:** send the link in a real messenger once

#### 9g — what was built

- **`src/lib/legal.ts`**: `OPERATOR`, `TAKEDOWN_DAYS` = 14, `LEGAL_UPDATED` (the "last updated"
  date both pages show; change it with the texts)
- **`LegalPage.svelte`**: the shell — "← Back to the game", the `h1` (`tabindex="-1"`), the date,
  and the prose styles as child selectors, so the routes are plain `h2` / `p` / `ul`. The prose
  is capped at `max-w-2xl` inside the run column
- **The prose is per language in the route** (`{#if de} … {:else} … {/if}`), not in the
  translation table: whole legal paragraphs as table entries would be unreadable. Short labels
  (`footer.*`, `legal.*`) are in the table. The server renders German (the game's default), so a
  crawler gets the binding version of the Impressum
- **The Impressum** has: operator (Medieninhaber), purpose and "Blattlinie" (private,
  non-commercial, no ads, no editorial line — the small-website disclosure under § 25 (5)
  MedienG), the screenshot credit, the takedown, a links disclaimer. No ODR link: the EU's ODR
  platform closed on 20 July 2025. No UID or Firmenbuch: a private operator has neither
- **The privacy page** names Vercel Inc. (Covina, USA; the Data Privacy Framework and the DPA's
  standard contractual clauses for the US transfer), Vercel Blob in Frankfurt, Turso in Ireland,
  the six `localStorage` keys (`STORAGE_KEYS`, under § 165 (3) TKG 2021 as strictly necessary),
  the `geekster_admin` cookie, the GDPR rights and the Austrian DSB. **A new `localStorage` key,
  a cookie, a third-party request or analytics (Sprint 10) must change this page in the same
  commit**
- **The footer** (every page but admin and the brand assets): Impressum · Privacy, then the
  credit on its own line. `footer.poweredBy` is gone. **During a run** (`/`, phase `playing`)
  the two legal links open a new tab (with a screen-reader "(opens in a new tab)"): leaving the
  page would drop the round. The header's wordmark links to `/` off the game's page
- **Checked** (`npm run build && npm run preview`, headless Brave): axe 0 violations on both
  pages and the welcome screen, EN and DE, at 390 and 1280 px, no horizontal overflow, one
  `<title>`; `/impressum` → `/impressum/`; the header link lands on `/`; the footer links'
  targets on the welcome screen and during a run. Driver: `scratchpad/cdp/legal9g.mjs <outDir>`
  and `run9g.mjs` (gitignored)
- **Checked on staging** (2026-09-28, `d820940`): both pages and the welcome screen serve one
  title, one meta description and the footer; no overflow at 390 px; CI green
- **Verified 2026-09-28** against <https://vercel.com/legal/privacy-notice>: the address,
  Vercel's EU-U.S. DPF certification and its use of standard contractual clauses. The texts as a
  whole are still the operator's to check before the release

### Quality bar (every slice)

- `npm run lint && npm run check && npm run test && npm run build` before every push
- Every new label in EN and DE. No hard-coded English in a component
- No colour outside the tokens in the game's components after 9e (a `grep` for `-gray-`,
  `-purple-` … in `src/lib/components/*.svelte` comes back empty)
- Every transition goes through `motion.ts`. Nothing moves with reduced motion on except opacity
- Checked in a real browser at 390 px and 1280 px before a slice is called done

### Definition of done

The new look is released to production. Every screen and state from 9a's list is built from the
tokens and primitives. `/styleguide` shows every primitive in every state. A link sent in WhatsApp
shows the OG image and the pitch. The Impressum and the privacy page are live. The quality pass is
green.

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

---

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

## Sprint 11 - Encyclopedia Foundation (Phase E1)

> Goal: "What came out in 1998?", answered on a page search engines can read, with a Play button

The long-term plan, the data-source decisions (Wikidata as the CC0 backbone; not IGDB or
MobyGames) and the SEO reasoning are in `ROADMAP.md` § "The encyclopedia". Planned in detail at
sprint start. The outline:

- [ ] **Decide the i18n routing first.** The game's language switch is client-side. Server-rendered
      pages need the language in the URL (`/de/…`) plus `hreflang`
- [ ] `/years/[year]`, rendered on the server: our published games of that year, the platforms
      launched that year, and a short text of our own
- [ ] **"Play this year" / "Play this decade"**: a deck, via `?from=&to=` on the random endpoint
- [ ] `platforms` table (name, manufacturer, launch year), seeded by hand, with admin CRUD
- [ ] **Encyclopedia pages never show a puzzle screenshot**, or a single search would give the
      Daily away. They need cover art or a second, non-primary image, so decide the image source
- [ ] `sitemap.xml`, `schema.org` `ItemList` / `VideoGame`, internal links between years
- [ ] The RAWG link stays on every page that uses RAWG data (their terms)

---

## Sprint 12 - Playing Together

> Goal: Geekster at a game night

### 12a — Party mode (pass-and-play)

- [ ] US-12.1: As a group, we play on one device. 2–6 players take turns on one shared timeline,
      and the first to 10 correct placements wins (the 10-placement goal lives on here)
- [ ] No new infrastructure: client-side state only, the same pool and modes

### 12b — Real-time multiplayer (only if party mode shows the demand)

- [ ] US-12.2: As a player, I can create a room and share a code or link
- [ ] US-12.3: As a player, I can join a room with a code
- [ ] US-12.4: As players, we take turns on a shared timeline and see each other's turns and
      scores in real time
- [ ] US-12.5: As a player, I see a final results screen comparing all players

| Component              | Choice                                         | Rationale                                             |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| **Real-time**          | **PartyKit** or **Cloudflare Durable Objects** | Managed WebSocket infrastructure, free tier available |
| **Session management** | Server-side room state                         | Prevents cheating, single source of truth             |

- [ ] Infrastructure: room creation and joining, WebSocket connection management
- [ ] Game logic: server-side turn management, shared state sync, optional turn timer, scoring per
      player (reuses Sprint 10's server-side replay)
- [ ] UI: room create / join, player list, turn indicator, live scores, results screen
