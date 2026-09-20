# Geekster

A timeline guessing game for video game screenshots. Players place game screenshots in chronological order by release year — similar to the card game Hitster, but with video games.

## Tech Stack

- **Framework:** SvelteKit (Svelte 5 with runes)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Admin UI primitives:** `bits-ui` — headless, Svelte 5 native. Only the dialog is used (confirm
  - lightbox); everything keeps the panel's own Tailwind classes
- **Backend:** SvelteKit API routes (`src/routes/api/`)
- **Database:** Turso (libSQL/SQLite) via Drizzle ORM — the single source of truth for games, screenshots and scores. `games.json` is seed data, not a runtime fallback
- **Image storage:** Vercel Blob — public store `geekster-screenshots` (fra1). The DB holds absolute blob URLs; `static/screenshots/` is the upload source for `blob:migrate` and what a freshly seeded local database points at
- **Hosting:** Vercel (`@sveltejs/adapter-vercel`, SSR + API routes) — no base path. Live at <https://geekster.pro> (`www` 308-redirects to the apex; DNS at IONOS)
- **i18n:** Custom reactive translation system (EN/DE) — the game only; the admin panel is English-only
- **Admin auth:** `ADMIN_PASSWORD` env var + HMAC-signed session cookie (no extra table)

## Project Structure

```
src/
├── lib/
│   ├── components/       # Svelte components (13 total)
│   │   ├── admin/
│   │   │   ├── ConfirmDialog.svelte     # bits-ui modal for destructive actions
│   │   │   ├── ImageLightbox.svelte     # bits-ui modal: screenshot at full size
│   │   │   ├── ScreenshotUpload.svelte  # File picker: preview + WebP downscale
│   │   │   └── Spinner.svelte           # Inline loading spinner
│   │   ├── BonusGuessPanel.svelte  # Year/name bonus guess with countdown
│   │   ├── GameCard.svelte         # Game screenshot card
│   │   ├── GameScreen.svelte       # Main gameplay (timeline + drag-drop)
│   │   ├── LangSwitch.svelte       # EN/DE language toggle
│   │   ├── Leaderboard.svelte      # Local score leaderboard
│   │   ├── ResultScreen.svelte     # Win/game-over screen
│   │   ├── ScoreReveal.svelte      # Animated score breakdown
│   │   ├── TimelineSlot.svelte     # "Place here" slot buttons
│   │   └── WelcomeScreen.svelte    # Start screen with instructions
│   ├── data/
│   │   ├── README.md     # Why games.json is seed data and who reads it
│   │   └── games.json    # 125 game entries — seed data for `db:seed`, not loaded at runtime
│   ├── server/           # Server-only code (never imported client-side)
│   │   ├── auth.ts       # Admin password check + signed session cookie
│   │   ├── blob.ts       # Vercel Blob upload/delete for screenshots
│   │   ├── db.ts         # Lazy-initialised Drizzle client (Turso)
│   │   ├── games.ts      # Game/screenshot CRUD used by the admin panel
│   │   ├── rawg.ts       # RAWG search + image download (rawg.io only)
│   │   ├── schema.ts     # Drizzle schema: games, screenshots, scores
│   │   └── stats.ts      # Dashboard counts and recent activity
│   ├── adminList.ts      # Game-list sort/search/filter query shared by the admin pages
│   ├── game.svelte.ts    # Core game state & logic (Svelte 5 runes)
│   ├── imageUrl.ts       # Resolves screenshot URLs (absolute blob vs. local path)
│   ├── i18n.svelte.ts    # Internationalization (EN/DE translations)
│   ├── index.ts          # Barrel exports
│   ├── leaderboard.ts    # localStorage leaderboard CRUD
│   ├── scoring.ts        # Score calculation (year, name, streak)
│   └── types.ts          # TypeScript type definitions
├── routes/
│   ├── admin/                       # Admin panel — guarded by hooks.server.ts
│   │   ├── +layout.svelte           # Sidebar shell
│   │   ├── +page.svelte/.server.ts  # Dashboard: stats, quick add, recent scores
│   │   ├── login/                   # Password login (form action)
│   │   ├── logout/+server.ts        # POST — clears the session cookie
│   │   └── games/                   # List (search/sort/filter), new, [id] edit, import (bulk CSV/JSON)
│   ├── api/
│   │   ├── admin/rawg/+server.ts    # GET  — RAWG screenshot search (admin only)
│   │   ├── games/+server.ts         # GET  — all games with primary screenshot
│   │   ├── games/random/+server.ts  # GET  — random game set for a round
│   │   └── scores/+server.ts        # GET/POST — global leaderboard
│   ├── +layout.svelte    # Global layout (Tailwind import, dark theme)
│   ├── +layout.ts        # Layout config (trailing slash)
│   └── +page.svelte      # Main page (routes between game phases)
├── hooks.server.ts       # Admin session check, route guard, noindex outside production
└── app.css               # Tailwind CSS import
static/
├── robots.txt
└── screenshots/          # 125 .webp game screenshot images
drizzle/                  # Versioned schema migrations — committed and reviewed like code
├── 0000_baseline.sql     # The schema as it already existed; stamped, never run
└── meta/_journal.json    # Drizzle's migration index
.github/
└── workflows/
    └── ci.yml            # Lint, format, svelte-check and build on PRs and main/develop
scripts/
├── convert-screenshots.cjs    # Convert screenshot formats
├── fetch-screenshots.cjs      # Download screenshots from RAWG API
├── generate-placeholders.cjs  # Generate placeholder SVG images
├── import-games.cjs           # CLI tool for adding/listing games
├── db-target.js               # Resolves local/staging/production to a URL + token, with guards
├── load-env.js                # Shared .env loader for node scripts
├── migrate-screenshots-to-blob.js  # Upload screenshots to Vercel Blob + update DB
├── seed-database.js           # Seed Turso from games.json
└── stamp-migrations.js        # Mark a migration as applied without running it (baseline only)
.claude/docs/
└── schema-migrations.md       # The migration runbook (Sprint 7h-b)
```

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint
- `npm run lint:fix` — Run ESLint with auto-fix
- `npm run format` — Format all files with Prettier
- `npm run format:check` — Check formatting without writing
- `npm run check` — Run svelte-check (TypeScript validation for .svelte files)
- `npm run game:add "Game Name" 2023` — Add a new game (auto-generates ID + placeholder)
- `npm run game:list` — List all games sorted by year
- `npm run db:generate` — Generate a migration in `drizzle/` from `src/lib/server/schema.ts`
- `npm run db:migrate` — Apply pending migrations locally (`file:local.db`)
- `npm run db:migrate:staging` / `db:migrate:production` — Apply them to a named stage, reading
  `TURSO_STAGING_*` / `TURSO_PRODUCTION_*`; no `.env` editing, and guarded against a mixed-up URL
- `npm run db:stamp -- --target=local|staging|production` — Record a migration as already applied
  without running its SQL (`--dry-run`, `--tag=`). Used once, for the baseline
- `npm run db:seed` — Upsert `games.json` into the database by slug (`-- --force`, `-- --dry-run`)
- `npm run db:studio` — Drizzle Studio (browse the database)
- `npm run blob:migrate` — Upload `static/screenshots/` to Vercel Blob and rewrite DB URLs (`--dry-run`, `--force`)

## Documentation

Docs are part of the change, not a follow-up. `CLAUDE.md`, `SPRINTS.md`, `README.md` and
`.claude/docs/` must be corrected in the same commit that makes them wrong — see
`.claude/rules/documentation.md` for who owns what and what counts as a trigger.
`.claude/hooks/docs-sync-guard.sh` blocks the first `git commit` that stages code without
staging any document.

## Code Quality

- **ESLint:** Configured with `eslint-plugin-svelte` + `typescript-eslint` (flat config)
- **Prettier:** With `prettier-plugin-svelte` + `prettier-plugin-tailwindcss`
- **Pre-commit hooks:** Husky + lint-staged runs ESLint fix + Prettier on staged files
- **svelte-check:** TypeScript checking for .svelte files (run manually or in CI, not in pre-commit)

## Conventions

- Use **Svelte 5 runes** (`$state`, `$derived`, `$props`) — NOT legacy Svelte stores or reactive declarations
- Avoid naming variables `state` in `.svelte` and `.svelte.ts` files — use `gameState` or similar to prevent conflicts with the `$state` rune
- Use `$state()` with type annotation on the `let` (e.g., `let foo: string | null = $state(null)`) — NOT generic syntax `$state<T>()` in .svelte files
- Use keyed `{#each}` blocks: `{#each items as item (item.id)}` — enforced by `svelte/require-each-key`
- Tailwind class ordering is handled automatically by `prettier-plugin-tailwindcss`
- Use tabs for indentation, single quotes, no trailing commas (see `.prettierrc`)
- Use `on` attribute event handlers (`onclick`, `onkeydown`) — NOT legacy `on:event` syntax

## Game Logic

- **Game data:** 125 games in the `games` table (Turso), each with a primary screenshot. The client fetches `/api/games/random`; if that fails there is no game — `GameState.error` holds a translation key, the phase stays `welcome`, and `WelcomeScreen` shows the message with the start button turned into a retry. There is deliberately no client-side fallback dataset
- **Flow:** Welcome → Playing → Result
- **Core mechanic:** Player places games in a timeline. The first game is an anchor (year visible). Subsequent games must be placed in the correct chronological position relative to existing timeline entries.
- **Reveal flow:** After correct placement, bonus guess panel appears (year + name), then score reveal (~2s), then next game
- **Scoring:** Base 100 for correct placement + year bonus (up to 50) + name bonus (up to 50), multiplied by streak (1.0–1.5x)
- **Win condition:** 10 correct placements
- **Lives:** 3 lives; wrong placement costs 1 life, resets streak
- **Wrong placement:** The game is auto-inserted at its correct position; no bonus guess offered
- **Drag-and-drop:** HTML5 DnD on desktop, touch long-press (250ms) on mobile with auto-scroll
- **Leaderboard:** Top scores stored in localStorage
- **Restart:** "Play Again" starts a new game directly; "Main Menu" returns to welcome screen

## Environments

Three stages, all on free tiers (Vercel Hobby, Turso free, GitHub Actions on a public repo):

| Stage          | Branch           | URL                            | Database                 |
| -------------- | ---------------- | ------------------------------ | ------------------------ |
| **Production** | `main`           | <https://geekster.pro>         | Turso `geekster`         |
| **Staging**    | `develop`        | <https://staging.geekster.pro> | Turso `geekster-staging` |
| **Preview**    | any other branch | generated `*.vercel.app` URL   | Turso `geekster-staging` |

Vercel's `Development` environment cannot be deleted — it is left unpopulated, because local
work uses the repo's `.env` and `npm run dev`, never `vercel dev`.

- **Staging and preview share one set of variables.** Vercel Custom Environments are a Pro
  feature, so the Hobby plan has exactly one Preview environment. `staging.geekster.pro` is a
  project domain pinned to the `develop` branch — a preview deployment with a stable name, not a
  third environment. Anything set for Preview therefore also applies to every feature-branch
  preview
- **Local `.env` points at `file:local.db`**, not at Turso. The admin panel deletes games and blob
  files, so a local session must not be able to reach production. The live Turso credentials stay
  in the file commented out for deliberate one-off operations
- **One blob store for all three stages.** `src/lib/server/blob.ts` writes everything outside
  production under a `staging/` pathname prefix, because the upload deliberately reuses the
  pathname (`screenshots/<slug>.webp`) and would otherwise overwrite a production image. A
  separate store per stage would also be free — Hobby allows 100 — but one store plus a prefix is
  one thing to configure instead of three
- **A stage only deletes its own blobs.** `deleteScreenshotBlob()` refuses any URL whose pathname
  belongs to another stage, in both directions: staging will not delete a production image,
  production will not delete a `staging/` one. It logs and leaves the file alone — an orphaned
  file is recoverable, a deleted production image is not. This is what lets staging hold
  production's absolute blob URLs, so a refresh from production copies no images at all
- **A deleted blob can still be served from cache.** Uploads set `cacheControlMaxAge` to a year,
  so a `curl` of a just-deleted URL may still answer 200. `list({ prefix })` from
  `@vercel/blob` is the authoritative check
- **Staging is behind Vercel Authentication, production is not.** The project's protection is
  "all except custom domains", and that exemption covers only the **production** custom domain: a
  domain pinned to a branch still resolves to a preview deployment, so `staging.geekster.pro`
  answers `302 https://vercel.com/sso-api` to anyone not logged into the Vercel account
  (verified — geekster.pro returns 200). `src/hooks.server.ts` still sends
  `X-Robots-Tag: noindex, nofollow` whenever `VERCEL_ENV` is anything but `production`; it costs
  nothing and keeps every non-production host out of the index if that protection is ever relaxed
- **Data flows one way: production → staging.** There is deliberately no staging → production
  sync; see `SPRINTS.md` § Sprint 7h for why. Staging is currently seeded from `games.json` with
  local `/screenshots/…` paths; once `db:refresh-staging` exists it will copy production's rows
  verbatim, blob URLs included, which the delete guard makes safe. **Never run `blob:migrate`
  against the staging database**
- `ADMIN_PASSWORD` is set for Production. Preview has none, so the admin panel there stays closed
  until one is added in the dashboard
- `ADMIN_PASSWORD`, `RAWG_API_KEY` and both `TURSO_AUTH_TOKEN` entries are Vercel **sensitive**
  variables: write-only, not readable back through the dashboard, the API or the CLI. The only
  readable copies are in the local `.env` — lose those and the secret has to be rotated, not looked up
- **Env vars are bound at build time.** Changing one does not affect the running deployment; a
  redeploy is required before the new value is live

## Schema Migrations

`drizzle/` is the schema's history and the only thing allowed to create or alter a table.
Baselined in Sprint 7h-a.

- **`db:push` is retired and the script is gone.** It changes a database without leaving a record,
  which is how the three databases drifted apart in the first place. `db:generate` then
  `db:migrate`, both committed and reviewed like code
- **`seed-database.js` no longer creates tables.** It checks they exist and points at `db:migrate`.
  A fresh environment is `npm run db:migrate` then `npm run db:seed`, in that order
- **The baseline was stamped, not run.** All three databases already had their tables, and
  `0000_baseline.sql` is a plain `CREATE TABLE`, so running it would fail on the first statement.
  `npm run db:stamp -- --target=<stage>` writes the bookkeeping row that a successful run would
  have written: the sha256 of the `.sql` file and the journal's `when` as `created_at`. Verified
  against a real run on an empty database — the hashes match. The migrator skips any migration
  whose `when` is not newer than the newest `created_at`, so the stamped baseline is a no-op and
  everything after it applies normally
- **Stamping is for the baseline only.** `db:stamp` refuses a database whose tables are missing,
  and only ever stamps journal entry 0 unless `--tag=` is passed. Stamping a later migration
  silently skips real DDL
- **Production still has the old `created_at` default, and it is a live defect.** Production was
  built by `db:push` from the buggy schema, so all 127 games and 127 screenshots hold the string
  `CURRENT_TIMESTAMP` in `created_at` instead of a time. Staging was built by raw DDL and is
  clean; the two databases have never had identical schemas. Fixing production needs a
  hand-written corrective migration (SQLite cannot alter a column default — it is a table
  rebuild), which should wait for `db:dump` in 7h-d. Recorded in `SPRINTS.md` § 7h-a
- **`created_at` used to be generated wrong.** `schema.ts` had `.default('CURRENT_TIMESTAMP')` — a
  JS string — which drizzle emits as the quoted literal `DEFAULT 'CURRENT_TIMESTAMP'`, so any
  database built from the migration stored the text `"CURRENT_TIMESTAMP"` instead of a timestamp
  and `new Date(score.createdAt)` in the leaderboard was `Invalid Date`. The live tables were
  correct because raw DDL made them. Fixed to ``.default(sql`CURRENT_TIMESTAMP`)`` before the
  baseline was committed, so the baseline matches the live tables
- **`drizzle.config.ts` fakes an auth token for `file:` URLs.** The `turso` dialect validates
  `authToken` as a required non-empty string, but @libsql/client never sends it for a local file —
  without the placeholder the config's own `file:local.db` fallback is unreachable
- Migrations are run from a laptop, never from CI: CI would need production credentials in GitHub
  secrets, and a migration that fails halfway through a deploy has no rollback
- **Order is staging first, production at release.** Vercel deploys the code; it never applies a
  migration, so the migration is a separate manual step on either side of the deploy
- **Expand, then contract.** Never drop a column in the same release that changes the code using
  it — rolling the app back must not strand the database. A rename is three releases: add, backfill,
  drop
- **A migration names its stage; nothing is uncommented and nothing has to be undone.**
  `npm run db:migrate` (local), `db:migrate:staging`, `db:migrate:production`, and
  `db:stamp -- --target=<stage>`. `scripts/db-target.js` resolves the stage for both
  `drizzle.config.ts` and `stamp-migrations.js`, and refuses an unknown stage, a missing variable,
  a production URL that is a `file:` path or contains `staging`, and a staging URL identical to
  the production one
- **`TURSO_STAGING_*` and `TURSO_PRODUCTION_*` are read by the migration tooling only.** Nothing
  in `src/` reads them and they are set only in the local `.env`, never on Vercel.
  `TURSO_DATABASE_URL` — the one the app reads — stays at `file:local.db`, which is what keeps the
  local admin panel's delete buttons away from production while a migration is applied to it
- **Full runbook: `.claude/docs/schema-migrations.md`** — generate, review, apply, expand/contract,
  stamping, and what to do when a migration fails partway

## Deployment & CI

- **Deploys come from Vercel's Git integration, not from a workflow.** Push to `main` builds
  Production and aliases it to geekster.pro; push to `develop` builds Preview and aliases it to
  staging.geekster.pro; any other branch gets a throwaway preview URL. No `VERCEL_TOKEN` is stored
  in GitHub — nothing in CI deploys
- **`.github/workflows/ci.yml` is the quality gate Vercel does not provide.** It runs `npm ci`,
  `lint`, `format:check`, `check` and `build` on every pull request and on pushes to `main` and
  `develop`. Vercel only ever runs `vite build`, which neither lints nor type-checks `.svelte`
  files. The workflow needs no secrets: the database client is lazy and reads
  `$env/dynamic/private` at request time
- **`main` is protected** — pull request required, CI must pass, no force pushes. Work goes
  `feature/*` → PR → `develop` (staging) → PR → `main` (production)

## Admin Panel

- **URL:** `/admin` (live: <https://geekster.pro/admin>). Login at `/admin/login`
- **Auth:** `ADMIN_PASSWORD` env var. `src/lib/server/auth.ts` compares it in constant time and
  signs a 12-hour session cookie with the password as the HMAC key — changing the password logs
  every session out. Without the variable the admin area is closed, not open. No rate limiting:
  a serverless function has no shared memory to count attempts in
- **Guard:** `src/hooks.server.ts` sets `locals.admin`, redirects `/admin/**` to the login page and
  answers `/api/admin/**` with 401
- **A game without a screenshot is never served.** `/api/games` and `/api/games/random` inner-join
  the primary screenshot, so such a game simply does not exist for players. Creation stays
  permissive (create first, pull a RAWG shot after), and the admin list flags the gap: a red badge
  per row, a banner with the total and a `?missing=1` filter
- **Game list:** the whole row opens the game; search fires on its own after 3 characters with a
  300 ms debounce (no Search button); sort, search and filter live in the URL and travel with the
  row click, so the detail page's prev/next chevrons walk that same list
- **Modals:** `ConfirmDialog.svelte` (delete) and `ImageLightbox.svelte` (screenshot at full size,
  from both the list and the detail page) wrap `bits-ui`'s dialog — focus trap, Escape and
  click-outside come from it
- **Screenshots:** uploaded straight to Vercel Blob. `ScreenshotUpload.svelte` re-encodes to WebP
  and scales the longest edge to 1600px in the browser first. Deleting a game or screenshot deletes
  the blob too; local `/screenshots/...` paths (seed data) are left alone
- **RAWG:** the search button shows a spinner while the lookup runs, and an import disables every
  candidate tile until it finishes — a second click used to import the same screenshot twice.
  Extra screenshots are harmless: `addScreenshot()` only marks the first one primary and the game
  serves the primary alone
- **RAWG:** `RAWG_API_KEY` enables the screenshot picker (set for Production). Only `rawg.io` URLs
  can be imported — the URL arrives from the browser and is untrusted. RAWG images are stored as
  served (full-size JPEG); only browser uploads get the WebP/1600px treatment
- **Language:** the admin UI is English-only, deliberately — it is a single-operator tool

## Sprint Progress

See `SPRINTS.md` for the full sprint plan. Currently completed: Sprint 1 (MVP), Sprint 2 (Game Database & Polish), Sprint 3 (Lives, Streak & Drag-and-Drop), Sprint 4 (Bonus Points & Scoring), Sprint 5 (Real Screenshots, i18n & GitHub Pages), Sprint 6 (Backend Foundation & Database, incl. screenshot migration to Vercel Blob), Sprint 7 (Admin Panel: data ownership, auth, game and screenshot management, RAWG import, dashboard), Sprint 7f (admin usability pass: row navigation, modals, lightbox, loading states, missing-screenshot flag), Sprint 7g (CI gate, develop branch, staging.geekster.pro, cross-stage blob delete guard), Sprint 7h-a (Drizzle migrations baselined and stamped, `db:push` retired), Sprint 7h-b (the migration runbook in `.claude/docs/schema-migrations.md`). Next: Sprint 7i (draft mode, one image pipeline, RAWG preview), with 7h-c/7h-d (staging refresh, backups) when needed — all before Sprint 8.

## Adding New Games

Use the CLI tool:

```bash
npm run game:add "Game Name" 2023
```

This auto-assigns an ID, generates the screenshot slug, validates input, and regenerates placeholder SVGs.

This writes to `src/lib/data/games.json`, which is **seed data for local and fresh environments**, not the live dataset. The live game reads the database; a game only exists there once it has been seeded or created in the admin panel.

> **`db:seed` is an upsert (since Sprint 7a).** It inserts games whose `slug` is missing, corrects a changed `name`/`year`, and never deletes a row, reassigns an ID or overwrites a screenshot URL that a game already has — so the absolute Vercel Blob URLs survive a re-seed. It refuses to run against a non-empty `games` table unless `--force` is passed; `--dry-run` prints the plan. Screenshots it inserts itself point at local paths, so `blob:migrate` runs afterwards.

Alternatively, manually add entries to `src/lib/data/games.json` and add a `.webp` screenshot to `static/screenshots/`.
