# Project Structure (Current)

```
src/
├── app.css                         # Tailwind CSS v4 imports
├── app.d.ts                        # SvelteKit type declarations
├── app.html                        # HTML shell template
├── lib/
│   ├── assets/
│   │   └── favicon.svg
│   ├── components/                 # UI components (9 total)
│   │   ├── BonusGuessPanel.svelte  # Year/name bonus guess form with countdown timer
│   │   ├── GameCard.svelte         # Game screenshot card (compact + full modes)
│   │   ├── GameScreen.svelte       # Main gameplay: timeline, drag-drop, placement
│   │   ├── LangSwitch.svelte       # EN/DE language toggle
│   │   ├── Leaderboard.svelte      # Top scores table (localStorage)
│   │   ├── ResultScreen.svelte     # Win/loss screen with score + leaderboard
│   │   ├── ScoreReveal.svelte      # Animated score breakdown after each round
│   │   ├── TimelineSlot.svelte     # "Place here" drop target / button
│   │   └── WelcomeScreen.svelte    # Start screen with rules, language switch
│   ├── data/
│   │   └── games.json              # 125 games — seed data for db:seed, never loaded at runtime
│   ├── server/                     # Server-only (never imported from a component)
│   │   ├── db.ts                   # Lazy Drizzle client over Turso (libSQL)
│   │   └── schema.ts               # Drizzle schema: games, screenshots, scores
│   ├── game.svelte.ts              # Core game state machine (Svelte 5 runes)
│   ├── imageUrl.ts                 # resolveScreenshotUrl(): absolute blob URL vs. local path
│   ├── i18n.svelte.ts              # Internationalization (EN/DE translations)
│   ├── index.ts                    # Barrel exports
│   ├── leaderboard.ts              # localStorage leaderboard CRUD
│   ├── scoring.ts                  # Score calculation (year, name, streak)
│   └── types.ts                    # Shared TypeScript types
├── routes/
│   ├── api/
│   │   ├── games/+server.ts             # GET  — all games + primary screenshot
│   │   ├── games/random/+server.ts      # GET  — random set for one round
│   │   └── scores/+server.ts            # GET/POST — global leaderboard
│   ├── +layout.svelte              # Root layout (dark theme, Tailwind)
│   ├── +layout.ts                  # Layout config (trailing slash)
│   └── +page.svelte                # Main page (phase-based component routing)
static/
├── robots.txt
└── screenshots/                    # 125 .webp game screenshot images
scripts/
├── convert-screenshots.cjs         # Convert screenshot image formats
├── fetch-screenshots.cjs           # Download screenshots from RAWG API
├── generate-placeholders.cjs       # Generate SVG placeholder images
├── import-games.cjs                # CLI: add/list games in games.json
├── load-env.js                     # Shared .env loader (strips quoted values)
├── migrate-screenshots-to-blob.js  # Upload screenshots to Vercel Blob, rewrite DB URLs
└── seed-database.js                # Seed Turso from games.json
```

## Config Files

- `svelte.config.js` — `@sveltejs/adapter-vercel`, no base path
- `vite.config.ts` — Tailwind CSS v4 + SvelteKit plugins
- `eslint.config.js` — Flat config, svelte + typescript-eslint
- `.prettierrc` — Tabs, single quotes, no trailing commas, svelte + tailwind plugins
- `tsconfig.json` — Strict mode, bundler module resolution
- `drizzle.config.ts` — Drizzle Kit, dialect `turso`, falls back to `file:local.db`

## Deployment

- **Target**: Vercel — <https://geekster.pro> (`www` 308-redirects to the apex)
- **Adapter**: `@sveltejs/adapter-vercel` (SSR + API routes; nothing is prerendered)
- **Base path**: none
- **CI/CD**: Vercel builds on every push to `main`; there is no GitHub Actions workflow
- **DNS**: registrar IONOS, A records for apex and `www` point at Vercel. Nameservers stay with IONOS
- **Env vars**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`. Set in the Vercel
  dashboard and mirrored in a local `.env` for the node scripts (see `scripts/load-env.js`)
