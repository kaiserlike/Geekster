# Geekster

A timeline guessing game for video game screenshots. Players place game screenshots in chronological order by release year — similar to the card game Hitster, but with video games.

## Tech Stack

- **Framework:** SvelteKit (Svelte 5 with runes)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Database:** JSON file (Sprint 1), SQLite planned for Sprint 2
- **Hosting target:** Vercel / Cloudflare Pages (free tier)

## Project Structure

```
src/
├── lib/
│   ├── components/       # Svelte components
│   │   ├── WelcomeScreen.svelte   # Start screen with instructions
│   │   ├── GameScreen.svelte      # Main gameplay (timeline + placement)
│   │   ├── GameCard.svelte        # Game screenshot card
│   │   ├── TimelineSlot.svelte    # "Place here" slot buttons
│   │   └── ResultScreen.svelte    # Win/game-over screen
│   ├── data/
│   │   └── games.json    # Game entries (id, name, year, screenshot path)
│   ├── game.svelte.ts    # Core game state & logic (Svelte 5 runes)
│   └── types.ts          # TypeScript type definitions
├── routes/
│   ├── +layout.svelte    # Global layout (Tailwind import, dark theme)
│   └── +page.svelte      # Main page (routes between game phases)
└── app.css               # Tailwind CSS import
static/
└── screenshots/          # Game screenshot images (SVG placeholders for now)
scripts/
└── generate-placeholders.cjs  # Script to generate placeholder SVG images
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

## Code Quality

- **ESLint:** Configured with `eslint-plugin-svelte` + `typescript-eslint` (flat config)
- **Prettier:** With `prettier-plugin-svelte` + `prettier-plugin-tailwindcss`
- **Pre-commit hooks:** Husky + lint-staged runs ESLint fix + Prettier on staged files
- **svelte-check:** TypeScript checking for .svelte files (run manually or in CI, not in pre-commit)

## Conventions

- Use **Svelte 5 runes** (`$state`, `$derived`, `$props`) — NOT legacy Svelte stores or reactive declarations
- Avoid naming variables `state` in `.svelte` files — use `gameState` or similar to prevent conflicts with the `$state` rune
- Use `$state()` with type annotation on the `let` (e.g., `let foo: string | null = $state(null)`) — NOT generic syntax `$state<T>()` in .svelte files
- Use keyed `{#each}` blocks: `{#each items as item (item.id)}` — enforced by `svelte/require-each-key`
- Tailwind class ordering is handled automatically by `prettier-plugin-tailwindcss`
- Use tabs for indentation, single quotes, no trailing commas (see `.prettierrc`)

## Game Logic

- **Game data:** 20 games in `games.json`, each with id, name, year, screenshot path
- **Flow:** Welcome → Playing → Result
- **Core mechanic:** Player places games in a timeline. The first game is an anchor (year visible). Subsequent games must be placed in the correct chronological position relative to existing timeline entries.
- **Win condition:** 10 correct placements
- **Wrong placement:** The game is auto-inserted at its correct position; wrongPlacements counter increments

## Sprint Progress

See `SPRINTS.md` for the full sprint plan. Currently completed: Sprint 1 (MVP).

## Adding New Games

Add entries to `src/lib/data/games.json` with format:

```json
{
	"id": 21,
	"name": "Game Name",
	"year": 2023,
	"screenshot": "/screenshots/game-name.svg"
}
```

Then add the corresponding screenshot file to `static/screenshots/`. To generate placeholder SVGs, update the JSON and run: `node scripts/generate-placeholders.cjs`
