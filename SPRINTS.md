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

Sprints 1 through 7 are complete and live. **Sprint 8 is in progress, in the four slices of
§ Sprint 8 "Delivery order". Slice 1 is on staging with its release PR open; slice 2 (`0003`) is
next.**

| Sprint 8 slice                                              | Status                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| **1** — Vitest + CI, endless solo, life regain, perfect run | ✅ built, verified on staging; release PR `develop` → `main` open |
| **2** — `0003`, primary per difficulty, admin Normal/Pro    | ⏭ next                                                           |
| **3** — crop tool                                           | —                                                                 |
| **4** — Pro in the game                                     | —                                                                 |

**Hand step at the slice-1 release:** delete the single pre-endless row in production's `scores`
(id 1, 1925 points, a 10-game win; decided 2026-09-26), after a `db:dump -- --target=production`.
Staging has no rows.

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

- [ ] US-8.1: As a player, I choose Normal or Pro on the welcome screen, and my choice is
      remembered
- [ ] US-8.2: As a player, Pro shows only games that have a Pro screenshot and scores my bonus
      guesses more strictly
- [x] US-8.3: As a player, a run lasts until I lose my last life, and every streak of 10 gives a
      life back (max 3)
- [x] US-8.4: As a player, I see a proper end screen: placements, best streak, lives won back, and
      a "perfect run" when I have placed every game in the pool
- [ ] US-8.5: As a player, my local leaderboard keeps Normal and Pro apart
- [ ] US-8.6: As the admin, I can crop any screenshot, from RAWG or a file, to a 16:9 area before
      it is uploaded, and only the cropped part is stored
- [ ] US-8.7: As the admin, I can give a game a Normal shot, a Pro shot or both, and I see at a
      glance which one a game is missing
- [ ] US-8.8 (stretch): As the admin, I can re-crop an existing screenshot without searching RAWG
      again

### Tech Tasks

#### 8a — Content model (migration `0003`)

- [ ] Difficulty values become `normal | pro`. The migration rewrites `medium` → `normal` in
      `screenshots` and `scores`. **Changing the column default is a table rebuild in SQLite**:
      review what `db:generate` produces against the lessons of `0002` (Drizzle also inlines a
      static default into the INSERT, so the code change has to ship with it)
- [ ] "Primary" becomes **one primary per (game, difficulty)**. `addScreenshot()` marks the first
      shot of each difficulty primary, and "make primary" works within a difficulty
- [ ] New nullable columns on `screenshots`: `source_url` (the RAWG image URL, or null for a
      file) and the crop rectangle in source pixels. This is expand-only and safe, and it enables
      US-8.8 and a per-screenshot source credit (see `ROADMAP.md` § Cross-cutting)
- [ ] Live rule per mode: **published AND a primary screenshot of that difficulty.**
      `/api/games/random` and `/api/games` take `?difficulty=normal|pro` (default `normal`)
- [ ] Admin: the game page has two slots, Normal and Pro. The list shows `NORMAL` / `PRO` chips.
      `NO SCREENSHOT` (red) means neither. `?missing=normal|pro` filter. The dashboard counts live
      games per mode
- [ ] Runbook order: staging first, production at release, `db:dump` before each

#### 8b — Crop tool

- [ ] Recommended: **`svelte-easy-crop` 5.x**: Svelte 5 native, no dependencies, about 30 kB,
      maintained by the react-easy-crop author, and it returns a pixel rectangle. The fallback is
      a hand-rolled canvas crop (about 100 lines, but touch and keyboard handling are then ours).
      `cropperjs` 2 is web components without Svelte bindings, so it was not chosen. Verify the
      version at the start of the sprint
- [ ] The flow for both pickers: choose an image (file or RAWG preview) → **crop step** → encode →
      upload. It feeds the one image pipeline: `toWebp()` gains an optional `crop` rectangle
      (`drawImage(bitmap, sx, sy, sw, sh, …)`), so there is still exactly one encoder
- [ ] **The default rectangle is the largest centred 16:9 area.** That is exactly what
      `object-cover` shows today, so "upload without touching the crop" looks the same as now
- [ ] Resolution rules (proposed, confirm at sprint start):
  - output = the crop, scaled so the longest edge is ≤ 1600, so **at most 1600×900**, never
    scaled up
  - **hard minimum 640×360 source pixels**: the tool will not zoom in further, so Pro crops cannot
    turn into pixel soup
  - **warning below 960×540**: "will look soft on large screens". Below the 1344 px the card
    needs on a 2× screen, but acceptable, and arguably part of Pro's charm
  - the output size is shown live while cropping
- [ ] Available for Normal shots too, to cut a logo or a watermark off an edge. The 7i-d batch
      needed exactly that and did it by script
- [ ] Keyboard (arrow keys move, +/- zoom) and touch. The crop step lives in the `bits-ui` dialog
      like the lightbox
- [ ] Verified in a real browser over CDP (see memory "browser-driving-over-cdp"), on the edit
      page and the create form

#### 8c — Gameplay

- [x] **Vitest first**: tests for `scoring.ts` and the placement logic (ties, the first and last
      slot, life regain) before any of it changes. Add `npm run test` to CI
- [ ] Mode choice on `WelcomeScreen`, remembered in `localStorage`. Pro is shown only once its
      pool is at least `PRO_MIN_POOL` live games (**open**: value, and whether it is hidden or shown
      as "coming soon")
- [x] **Endless**: remove `TARGET_PLACEMENTS` from solo play. The client loads the mode's whole
      shuffled live pool in one request (a few hundred rows is small), instead of the fixed 14.
      Revisit at about 1000 games. The API's `count` cap (50) is raised accordingly
- [x] **Pool exhausted = perfect run.** The run ends with its own result, not an error. Decided in
      slice 1: a cleared pool is "Pool cleared!", and "Perfect run!" only with zero wrong placements
- [x] **Life regain**: at every streak multiple of 10, +1 life if below 3, with a visible
      animation. A wrong placement still resets the streak
- [ ] **Pro scoring** (proposed numbers, confirm at sprint start):
  - year bonus: Normal stays 50 − 10 per year off (0 at ±5). Pro gives 50 exact, 25 at ±1, else 0
  - name bonus: Normal stays 50 exact / 35 close / 20 partial or subtitle. Pro gives 50 exact, 35
    close, else 0 (no credit for a subtitle or a substring)
- [x] `ResultScreen`: no "win" in solo any more. Game over with placements, best streak, lives won
      back. A perfect-run variant
- [ ] Local leaderboard per mode. Old 10-game entries are not comparable with endless runs
      (**decided in slice 1: kept as a read-only "Classic" tab**). Slice 1 moved endless runs to
      `geekster-leaderboard-normal` and left `geekster-leaderboard` untouched; slice 4 only adds
      `geekster-leaderboard-pro`. The global `/api/scores` has no run-type column, so its single
      pre-endless row (1925, a 10-game win) is deleted at the slice-1 release instead of adding one
- [x] Long timelines: an endless run can reach 50+ cards. Check drag, auto-scroll and rendering
      on mobile, and add a compact view if it gets unwieldy. This is the polish risk of this sprint.
      **Slice 1 finding:** drag and edge auto-scroll held up at 55 cards on a 390 px phone (cards
      already collapse to one line while dragging), but tapping a slot meant ~14,000 px of
      screenshots to scroll through. Past 12 cards (`COMPACT_TIMELINE_AT`) the timeline and the
      result screen now show one line per game; the card just placed stays full-size
- [ ] `scores.difficulty` is written as `normal | pro`. All new strings in EN and DE
- [ ] Docs in the same commit: `CLAUDE.md` § Game Logic (win condition, lives, modes),
      `.claude/docs/game-architecture.md`, `.claude/docs/adding-games.md` (Normal/Pro, crop)

### Open decisions (ask at sprint start)

Decision 4 was answered at the start of slice 1 (2026-09-26): keep the old entries as "Classic".

1. `PRO_MIN_POOL`: its value (proposed 40), and whether Pro is hidden or shown as "coming soon"
   until then
2. The Pro scoring numbers above
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
| **2**    | 8a: `0003`, primary per difficulty, `?difficulty=`, Normal/Pro slots in the admin          | `0003`    | 8.7            | —                                 |
| **3**    | 8b: the crop tool in both pickers                                                          | none      | 8.6, 8.8 (str) | 3                                 |
| **4**    | Pro in the game: mode choice, Pro scoring, leaderboard per mode, `PRO_MIN_POOL` gate       | none      | 8.1, 8.2, 8.5  | 1, 2                              |

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

The staging run left one test row in staging's `scores`; production is untouched until the
release step above.

Slice 1 goes first because it needs no migration: a migration waiting on staging holds up every
release behind it. Slice 1 keeps writing today's `difficulty` value; `0003` rewrites it.

### Definition of done

Released to production through `develop` → `main`. The crop flow has been clicked through in a
real browser. Pro is live only once its pool meets `PRO_MIN_POOL`. Until then it is on
production but not offered.

---

## Sprint 9 - Redesign: Design System, Styleguide & New Look

> Goal: Geekster looks and feels like its own product. Every screen after this one is built from
> the design system, not restyled later

Placed straight after Sprint 8 on purpose (decision 2026-09-26): Sprint 8 adds little new UI, while
Sprints 10 and 11 add the three biggest new surfaces. Planned in detail at sprint start. The
outline:

### User Stories

- [ ] US-9.1: As a player, Geekster has a distinct visual identity (logo, colour, type, motion)
      that makes it recognisable in a shared link or a screenshot
- [ ] US-9.2: As a player, every screen works as well on a phone as on a desktop, and feedback on
      a placement feels satisfying (motion, and optionally sound)
- [ ] US-9.3: As a player with a disability, contrast, focus states and reduced motion are
      respected (WCAG 2.2 AA)
- [ ] US-9.4: As the developer, a living styleguide shows every component in every state, built
      from the real components so it cannot drift

### Tech Tasks

- [ ] **9a — Direction.** Audit every screen and state (welcome, playing, bonus, reveal, result,
      error, leaderboard). Claude Design proposes 2–3 visual directions, and the user picks one.
      No code yet
- [ ] **9b — Design system with Claude Design**, built from the existing codebase: tokens
      (colour, type scale, spacing, radius, elevation, motion durations and easings), core
      components (button, input, badge, dialog, toast) and game components (card, timeline slot,
      lives, streak meter, score reveal). Plus logo, favicon and **an OG image and share-card
      template**, which Sprint 10 needs
- [ ] **9c — Styleguide**: a `/styleguide` route with `noindex` rendering the real components, or
      the Claude Design artifact kept as the reference. Decide in 9a
- [ ] **9d — Implementation**: tokens into Tailwind v4's `@theme` in `src/app.css`, then the game
      screens restyled. **The admin panel gets the tokens only**, not a redesign: it is a
      single-operator tool
- [ ] **9e — Legal pages in the new look**: Impressum, privacy page, a takedown contact and a
      screenshot credit line (see `ROADMAP.md` § Cross-cutting). Required for a public site in
      Austria or Germany
- [ ] Quality bar: Lighthouse on mobile, no layout shift when a screenshot loads, and
      `prefers-reduced-motion` honoured

---

## Sprint 10 - Daily Timeline, Global Leaderboard & Sharing

> Goal: a reason to come back every day, and a reason to tell someone

### User Stories

- [ ] US-10.1: As a player, there is one **Daily Timeline** a day: the same 10 games for
      everyone, one attempt, numbered (#1, #2, …)
- [ ] US-10.2: As a player, I can share my daily result without spoilers (an emoji row of hits and
      misses, my score, a link)
- [ ] US-10.3: As a player, I see a global leaderboard: Endless Normal, Endless Pro, today's
      Daily. All-time and this week
- [ ] US-10.4: As a player, I enter a display name once and see my rank and personal best after a
      run
- [ ] US-10.5: As a player, I keep a daily streak (days in a row played)

### Architecture

- **Server-validated scores come first, before any leaderboard is public.** `POST /api/scores` is
  the only unauthenticated write endpoint today, and endless scores have no ceiling. The plan:
  - `POST /api/runs {mode}` → the server creates the run and fixes the game order
  - the client plays and then submits the **move log**: the slot chosen per game, the bonus
    guesses and timings
  - the server **replays** the log with the same pure `scoring.ts` and placement logic and stores
    the authoritative score. The client's score is for display only
  - This stops fabricated scores. It cannot stop a player looking a game up, and it doesn't try to
- **The daily set is a snapshot**: a `daily_challenges` table (date → game ids), written on the
  first request of the day, so publishing a game mid-day does not change today's puzzle. The day
  boundary (UTC or the player's local midnight) is **open**
- **Identity without accounts**: a random device id in `localStorage` plus a display name. It
  gives personal bests and a daily streak, and a device is lost if storage is cleared. Accounts
  are a later decision
- New tables: `runs`, `daily_challenges`. `scores` gains `run_id` and `device_id`. A migration,
  applied through the runbook
- Share image: text first. An OG image per result (`@vercel/og` / satori, from Sprint 9's
  template) is optional
- **Cookieless analytics** go in here, to measure `ROADMAP.md`'s product-goal signals. Check
  Vercel Web Analytics' Hobby limits first

### Tech Tasks

- [ ] Runs API with server-side replay, which retires today's `POST /api/scores`
- [ ] Daily Timeline: snapshot table, 10 placements, 3 lives, Normal pool, one attempt per device
- [ ] Share: the emoji result, copy to the clipboard / Web Share API
- [ ] `/leaderboard` page with pagination, mode and period filters
- [ ] Name entry with basic filtering, and an admin action to delete a leaderboard row
- [ ] Personal best and daily streak
- [ ] Analytics events: run started / finished, share clicked
- [ ] Docs: API routes in `README.md` and `CLAUDE.md`, and the tables in the structure docs

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
