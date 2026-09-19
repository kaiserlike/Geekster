# Geekster

A timeline guessing game for video game screenshots. Players place game screenshots in chronological order by release year — similar to the card game Hitster, but with video games.

## Tech Stack

- **Framework:** SvelteKit (Svelte 5 with runes)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Backend:** SvelteKit API routes (`src/routes/api/`)
- **Database:** Turso (libSQL/SQLite) via Drizzle ORM — the single source of truth for games, screenshots and scores. `games.json` is seed data, not a runtime fallback
- **Image storage:** Vercel Blob — public store `geekster-screenshots` (fra1). The DB holds absolute blob URLs; `static/screenshots/` is the upload source for `blob:migrate` and what a freshly seeded local database points at
- **Hosting:** Vercel (`@sveltejs/adapter-vercel`, SSR + API routes) — no base path. Live at <https://geekster.pro> (`www` 308-redirects to the apex; DNS at IONOS)
- **i18n:** Custom reactive translation system (EN/DE)

## Project Structure

```
src/
├── lib/
│   ├── components/       # Svelte components (9 total)
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
│   │   └── games.json    # 125 game entries — seed data for `db:seed`, not loaded at runtime
│   ├── server/           # Server-only code (never imported client-side)
│   │   ├── db.ts         # Lazy-initialised Drizzle client (Turso)
│   │   └── schema.ts     # Drizzle schema: games, screenshots, scores
│   ├── game.svelte.ts    # Core game state & logic (Svelte 5 runes)
│   ├── imageUrl.ts       # Resolves screenshot URLs (absolute blob vs. local path)
│   ├── i18n.svelte.ts    # Internationalization (EN/DE translations)
│   ├── index.ts          # Barrel exports
│   ├── leaderboard.ts    # localStorage leaderboard CRUD
│   ├── scoring.ts        # Score calculation (year, name, streak)
│   └── types.ts          # TypeScript type definitions
├── routes/
│   ├── api/
│   │   ├── games/+server.ts         # GET  — all games with primary screenshot
│   │   ├── games/random/+server.ts  # GET  — random game set for a round
│   │   └── scores/+server.ts        # GET/POST — global leaderboard
│   ├── +layout.svelte    # Global layout (Tailwind import, dark theme)
│   ├── +layout.ts        # Layout config (trailing slash)
│   └── +page.svelte      # Main page (routes between game phases)
└── app.css               # Tailwind CSS import
static/
├── robots.txt
└── screenshots/          # 125 .webp game screenshot images
scripts/
├── convert-screenshots.cjs    # Convert screenshot formats
├── fetch-screenshots.cjs      # Download screenshots from RAWG API
├── generate-placeholders.cjs  # Generate placeholder SVG images
├── import-games.cjs           # CLI tool for adding/listing games
├── load-env.js                # Shared .env loader for node scripts
├── migrate-screenshots-to-blob.js  # Upload screenshots to Vercel Blob + update DB
└── seed-database.js           # Seed Turso from games.json
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
- `npm run db:generate` / `db:migrate` / `db:push` — Drizzle schema migrations
- `npm run db:seed` — Seed the database from `games.json`
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

- **Game data:** 125 games in the `games` table (Turso), each with a primary screenshot. The client fetches `/api/games/random`; if that fails there is no game — the error is shown and the player can retry. There is deliberately no client-side fallback dataset
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

## Sprint Progress

See `SPRINTS.md` for the full sprint plan. Currently completed: Sprint 1 (MVP), Sprint 2 (Game Database & Polish), Sprint 3 (Lives, Streak & Drag-and-Drop), Sprint 4 (Bonus Points & Scoring), Sprint 5 (Real Screenshots, i18n & GitHub Pages), Sprint 6 (Backend Foundation & Database, incl. screenshot migration to Vercel Blob).

## Adding New Games

Use the CLI tool:

```bash
npm run game:add "Game Name" 2023
```

This auto-assigns an ID, generates the screenshot slug, validates input, and regenerates placeholder SVGs.

This writes to `src/lib/data/games.json`, which is **seed data for local and fresh environments**, not the live dataset. The live game reads the database; a game only exists there once it has been seeded or created in the admin panel.

> **`db:seed` is destructive until Sprint 7 reworks it.** It deletes and re-inserts the entire `games` and `screenshots` tables from `games.json`, resets every screenshot URL to a local path (so `blob:migrate` must run afterwards) and reassigns all IDs, because SQLite `AUTOINCREMENT` never reuses a value after a `DELETE`. Do not run it against production. See the Sprint 7 ground rules in `SPRINTS.md`.

Alternatively, manually add entries to `src/lib/data/games.json` and add a `.webp` screenshot to `static/screenshots/`.
