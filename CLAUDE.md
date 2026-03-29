# Geekster

A timeline guessing game for video game screenshots. Players place game screenshots in chronological order by release year — similar to the card game Hitster, but with video games.

## Tech Stack

- **Framework:** SvelteKit (Svelte 5 with runes)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Database:** JSON file (125 games)
- **Hosting:** GitHub Pages (static adapter, base path `/Geekster`)
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
│   │   └── games.json    # 125 game entries (id, name, year, screenshot)
│   ├── game.svelte.ts    # Core game state & logic (Svelte 5 runes)
│   ├── i18n.svelte.ts    # Internationalization (EN/DE translations)
│   ├── index.ts          # Barrel exports
│   ├── leaderboard.ts    # localStorage leaderboard CRUD
│   ├── scoring.ts        # Score calculation (year, name, streak)
│   └── types.ts          # TypeScript type definitions
├── routes/
│   ├── +layout.svelte    # Global layout (Tailwind import, dark theme)
│   ├── +layout.ts        # Layout config (prerender, trailing slash)
│   └── +page.svelte      # Main page (routes between game phases)
└── app.css               # Tailwind CSS import
static/
├── robots.txt
└── screenshots/          # 125 .webp game screenshot images
scripts/
├── convert-screenshots.cjs    # Convert screenshot formats
├── fetch-screenshots.cjs      # Download screenshots from RAWG API
├── generate-placeholders.cjs  # Generate placeholder SVG images
└── import-games.cjs           # CLI tool for adding/listing games
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

- **Game data:** 125 games in `games.json`, each with id, name, year, screenshot path
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

See `SPRINTS.md` for the full sprint plan. Currently completed: Sprint 1 (MVP), Sprint 2 (Game Database & Polish), Sprint 3 (Lives, Streak & Drag-and-Drop), Sprint 4 (Bonus Points & Scoring), Sprint 5 (Real Screenshots, i18n & GitHub Pages).

## Adding New Games

Use the CLI tool:

```bash
npm run game:add "Game Name" 2023
```

This auto-assigns an ID, generates the screenshot slug, validates input, and regenerates placeholder SVGs.

Alternatively, manually add entries to `src/lib/data/games.json` and add a `.webp` screenshot to `static/screenshots/`.
