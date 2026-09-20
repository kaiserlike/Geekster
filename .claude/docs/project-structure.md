# Project Structure (Current)

```
src/
├── app.css                         # Tailwind CSS v4 imports
├── app.d.ts                        # SvelteKit type declarations
├── app.html                        # HTML shell template
├── lib/
│   ├── assets/
│   │   └── favicon.svg
│   ├── components/                 # UI components (13 total)
│   │   ├── BonusGuessPanel.svelte  # Year/name bonus guess form with countdown timer
│   │   ├── GameCard.svelte         # Game screenshot card (compact + full modes)
│   │   ├── GameScreen.svelte       # Main gameplay: timeline, drag-drop, placement
│   │   ├── LangSwitch.svelte       # EN/DE language toggle
│   │   ├── Leaderboard.svelte      # Top scores table (localStorage)
│   │   ├── ResultScreen.svelte     # Win/loss screen with score + leaderboard
│   │   ├── ScoreReveal.svelte      # Animated score breakdown after each round
│   │   ├── TimelineSlot.svelte     # "Place here" drop target / button
│   │   ├── WelcomeScreen.svelte    # Start screen with rules, language switch
│   │   └── admin/
│   │       ├── ConfirmDialog.svelte     # bits-ui modal for destructive actions
│   │       ├── ImageLightbox.svelte     # bits-ui modal: screenshot at full size
│   │       ├── ScreenshotUpload.svelte  # File picker: preview + WebP downscale to 1600px
│   │       └── Spinner.svelte           # Inline loading spinner
│   ├── data/
│   │   ├── README.md               # Why games.json is seed data and who reads it
│   │   └── games.json              # 125 games — seed data for db:seed, never loaded at runtime
│   ├── server/                     # Server-only (never imported from a component)
│   │   ├── auth.ts                 # Admin password check + HMAC session cookie
│   │   ├── blob.ts                 # Vercel Blob upload/delete (token passed explicitly)
│   │   ├── db.ts                   # Lazy Drizzle client over Turso (libSQL)
│   │   ├── games.ts                # Game/screenshot CRUD for the admin panel
│   │   ├── rawg.ts                 # RAWG search + image download (rawg.io only)
│   │   ├── schema.ts               # Drizzle schema: games, screenshots, scores
│   │   └── stats.ts                # Dashboard counts and recent activity
│   ├── adminList.ts                # Game-list sort/search/filter query, shared by the admin pages
│   ├── game.svelte.ts              # Core game state machine (Svelte 5 runes)
│   ├── imageUrl.ts                 # resolveScreenshotUrl(): absolute blob URL vs. local path
│   ├── i18n.svelte.ts              # Internationalization (EN/DE translations)
│   ├── index.ts                    # Barrel exports
│   ├── leaderboard.ts              # localStorage leaderboard CRUD
│   ├── scoring.ts                  # Score calculation (year, name, streak)
│   └── types.ts                    # Shared TypeScript types
├── hooks.server.ts                 # Admin session guard + noindex header outside production
├── routes/
│   ├── admin/
│   │   ├── +layout.svelte          # Sidebar shell (skipped on the login page)
│   │   ├── +page.svelte            # Dashboard: stat tiles, quick add, recent scores
│   │   ├── +page.server.ts         # Dashboard load + quickAdd action
│   │   ├── login/                  # +page.svelte / +page.server.ts (form action)
│   │   ├── logout/+server.ts       # POST — clears the session cookie
│   │   └── games/
│   │       ├── +page.svelte/.server.ts       # List: debounced search, sort, missing-shot filter, delete
│   │       ├── new/                          # Create a game (+ optional screenshot)
│   │       ├── import/                       # Bulk CSV/JSON upsert by slug
│   │       └── [id]/                         # Edit details, prev/next, manage screenshots
│   ├── api/
│   │   ├── admin/rawg/+server.ts        # GET  — RAWG screenshot search (admin only)
│   │   ├── games/+server.ts             # GET  — all games + primary screenshot
│   │   ├── games/random/+server.ts      # GET  — random set for one round
│   │   └── scores/+server.ts            # GET/POST — global leaderboard
│   ├── +layout.svelte              # Root layout (dark theme; hides game chrome on /admin)
│   ├── +layout.ts                  # Layout config (trailing slash)
│   └── +page.svelte                # Main page (phase-based component routing)
static/
├── robots.txt
└── screenshots/                    # 125 .webp game screenshot images
.github/
└── workflows/
    └── ci.yml                      # CI gate: lint, format:check, svelte-check, build
scripts/
├── convert-screenshots.cjs         # Convert screenshot image formats
├── fetch-screenshots.cjs           # Download screenshots from RAWG API
├── generate-placeholders.cjs       # Generate SVG placeholder images
├── import-games.cjs                # CLI: add/list games in games.json
├── db-target.js                    # Resolves local/staging/production to a URL + token, guarded
├── load-env.js                     # Shared .env loader (strips quoted values)
├── migrate-screenshots-to-blob.js  # Upload screenshots to Vercel Blob, rewrite DB URLs
├── seed-database.js                # Upsert games.json into Turso (never deletes)
└── stamp-migrations.js             # Record a migration as applied without running its SQL
drizzle/                            # Migration history — the only thing that creates a table
├── 0000_baseline.sql               # The pre-existing schema; stamped into all three databases
└── meta/
    ├── 0000_snapshot.json          # Drizzle's schema snapshot, diffed by the next db:generate
    └── _journal.json               # Migration index — tag + `when`, which orders the runs
```

## Config Files

- `svelte.config.js` — `@sveltejs/adapter-vercel`, no base path
- `vite.config.ts` — Tailwind CSS v4 + SvelteKit plugins
- `eslint.config.js` — Flat config, svelte + typescript-eslint
- `.prettierrc` — Tabs, single quotes, no trailing commas, svelte + tailwind plugins
- `tsconfig.json` — Strict mode, bundler module resolution
- `drizzle.config.ts` — Drizzle Kit, dialect `turso`. Resolves its database from `DB_TARGET`
  (`local` by default, or `staging` / `production`) through `scripts/db-target.js`, so a migration
  never needs `.env` edited. The resolver supplies a placeholder `authToken` for `file:` URLs: the
  `turso` dialect validates it as a required non-empty string, but @libsql/client never sends it
  for a local file, so without the placeholder the local target could not be migrated at all

## Deployment

- **Target**: Vercel — <https://geekster.pro> (`www` 308-redirects to the apex)
- **Adapter**: `@sveltejs/adapter-vercel` (SSR + API routes; nothing is prerendered)
- **Base path**: none
- **CI/CD**: Vercel builds on every push to `main`; there is no GitHub Actions workflow
- **DNS**: registrar IONOS, A records for apex and `www` point at Vercel. Nameservers stay with IONOS
- **Env vars**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`,
  `ADMIN_PASSWORD` and the optional `RAWG_API_KEY`. Set in the Vercel dashboard and mirrored in a
  local `.env` for the node scripts (see `scripts/load-env.js`). Claude Code cannot write Vercel
  environment variables — that step is manual
