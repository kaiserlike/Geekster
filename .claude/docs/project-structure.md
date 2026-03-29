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
│   │   └── games.json              # 125 games (id, name, year, screenshot)
│   ├── game.svelte.ts              # Core game state machine (Svelte 5 runes)
│   ├── i18n.svelte.ts              # Internationalization (EN/DE translations)
│   ├── index.ts                    # Barrel exports
│   ├── leaderboard.ts              # localStorage leaderboard CRUD
│   ├── scoring.ts                  # Score calculation (year, name, streak)
│   └── types.ts                    # Shared TypeScript types
├── routes/
│   ├── +layout.svelte              # Root layout (dark theme, Tailwind)
│   ├── +layout.ts                  # Layout config (prerender, trailing slash)
│   └── +page.svelte                # Main page (phase-based component routing)
static/
├── robots.txt
└── screenshots/                    # 125 .webp game screenshot images
scripts/
├── convert-screenshots.cjs         # Convert screenshot image formats
├── fetch-screenshots.cjs           # Download screenshots from RAWG API
├── generate-placeholders.cjs       # Generate SVG placeholder images
└── import-games.cjs                # CLI: add/list games in database
```

## Config Files

- `svelte.config.js` — Static adapter, `/Geekster` base path for GitHub Pages
- `vite.config.ts` — Tailwind CSS v4 + SvelteKit plugins
- `eslint.config.js` — Flat config, svelte + typescript-eslint
- `.prettierrc` — Tabs, single quotes, no trailing commas, svelte + tailwind plugins
- `tsconfig.json` — Strict mode, bundler module resolution
- `.github/workflows/deploy.yml` — GitHub Pages deployment via GitHub Actions

## Deployment

- **Target**: GitHub Pages at `https://<user>.github.io/Geekster/`
- **Adapter**: `@sveltejs/adapter-static` with fallback
- **Base path**: `/Geekster` (set in svelte.config.js)
- **CI/CD**: GitHub Actions workflow on push to main
