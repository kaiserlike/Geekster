# Geekster - Sprint Plan

A timeline guessing game for video game screenshots. Similar to Hitster, but instead of songs, players place video game screenshots in chronological order.

## Tech Stack

- **Frontend/Backend:** SvelteKit (TypeScript)
- **Styling:** Tailwind CSS
- **Database:** JSON file (SQLite deferred to Sprint 4)
- **Hosting:** Vercel / Cloudflare Pages (free tier)

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

**Schema changes need real migrations.** There is no `drizzle/` directory — the current schema was
created by raw `CREATE TABLE IF NOT EXISTS` statements inside `seed-database.js` plus `db:push`.
Any new table (admin sessions, audit log) should go through `npm run db:generate` +
`npm run db:migrate` so the history exists from here on.

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
- [ ] Separate Turso database for staging, and the Preview env vars repointed at it
- [ ] `ADMIN_PASSWORD` for Preview — only after the database is split

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

**Staging is publicly reachable, deliberately.** Deployment protection on Vercel covers the
generated preview URLs but never a custom domain, and switching it to "all deployments" would put
geekster.pro behind a login too. So `src/hooks.server.ts` sends `X-Robots-Tag: noindex, nofollow`
whenever `VERCEL_ENV` is set to anything but `production`. The game itself is public anyway; the
admin panel stays closed on staging until `ADMIN_PASSWORD` is added there.

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

### The manual step that is left

Claude cannot create the staging database: there is no Turso CLI on this machine and the `.env`
holds only a database auth token, not a platform token. Run, on a machine with the Turso CLI:

```bash
turso db create geekster-staging
turso db show geekster-staging --url          # → TURSO_DATABASE_URL for Preview
turso db tokens create geekster-staging       # → TURSO_AUTH_TOKEN for Preview
```

Then point Preview at it and seed it:

```bash
# in Vercel: overwrite the Preview values of TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
TURSO_DATABASE_URL=<staging-url> TURSO_AUTH_TOKEN=<staging-token> npm run db:seed
```

**Until that is done, staging reads and writes the production database.** Adding
`ADMIN_PASSWORD` to Preview before then would expose a fully working admin panel onto live data —
that is why it is the last step, not the first. Env vars bind at build time, so the `develop`
branch needs a redeploy afterwards.

---

## Sprint 8 - Difficulty System

> Goal: Players can choose difficulty, which affects which screenshots are shown

### User Stories

- [ ] US-8.1: As a player, I can choose difficulty (Easy / Medium / Hard) on the welcome screen
- [ ] US-8.2: As a player, Easy mode shows the most recognizable screenshots
- [ ] US-8.3: As a player, Hard mode shows obscure or cropped screenshots
- [ ] US-8.4: As a player, my score reflects the difficulty I played on

### Tech Tasks

- [ ] Difficulty selector on welcome screen
- [ ] API: filter screenshots by difficulty when creating a game round
- [ ] Score multiplier based on difficulty (1x / 1.5x / 2x)
- [ ] Leaderboard filtered by difficulty

---

## Sprint 9 - Global Leaderboard

> Goal: Compete with other players worldwide

### User Stories

- [ ] US-9.1: As a player, I see a global leaderboard with top scores
- [ ] US-9.2: As a player, I can enter my name when submitting a score
- [ ] US-9.3: As a player, I can filter the leaderboard by difficulty and time period
- [ ] US-9.4: As a player, I see my rank after completing a game

### Tech Tasks

- [ ] Leaderboard page (`/leaderboard`)
- [ ] Score submission flow (name input after game)
- [ ] Leaderboard API with pagination, filtering, time ranges
- [ ] Anti-cheat: basic server-side score validation
- [ ] Personal best tracking

---

## Sprint 10 - Multiplayer

> Goal: Play with friends in real-time

### User Stories

- [ ] US-10.1: As a player, I can create a multiplayer room and get a share code/link
- [ ] US-10.2: As a player, I can join a room with a code
- [ ] US-10.3: As players, we take turns placing games on a shared timeline
- [ ] US-10.4: As a player, I see other players' scores and turns in real-time
- [ ] US-10.5: As a player, I see a final results screen comparing all players

### Architecture

| Component              | Choice                                         | Rationale                                             |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| **Real-time**          | **PartyKit** or **Cloudflare Durable Objects** | Managed WebSocket infrastructure, free tier available |
| **Session management** | Server-side room state                         | Prevents cheating, single source of truth             |

### Tech Tasks

#### 10a — Infrastructure

- [ ] Set up PartyKit (or Durable Objects)
- [ ] Room creation and join logic
- [ ] WebSocket connection management

#### 10b — Game Logic

- [ ] Server-side turn management
- [ ] Shared game state synchronization
- [ ] Timer per turn (optional)
- [ ] Score calculation per player

#### 10c — UI

- [ ] Room creation / join screen
- [ ] Player list sidebar
- [ ] Turn indicator
- [ ] Real-time score updates
- [ ] Multiplayer results screen
