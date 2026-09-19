# Adding Games to the Database

## Via CLI (preferred)

```bash
npm run game:add "Game Name" 2023
```

This auto-assigns an ID, generates a screenshot slug, validates input, and creates an SVG placeholder.

## Via Manual Edit

1. Add entry to `src/lib/data/games.json`:
   ```json
   {
     "id": <next_id>,
     "name": "Game Name",
     "year": 2023,
     "screenshot": "/screenshots/game-name.webp"
   }
   ```
2. Add screenshot image to `static/screenshots/` as `.webp` format
3. Run `node scripts/generate-placeholders.cjs` if you need placeholder SVGs

## Publishing to the Live Game

`games.json` is only the fallback dataset — the running game reads from the database.
A new game is not live until both of these have run:

```bash
npm run db:seed        # rewrite the games + screenshots tables from games.json
npm run blob:migrate   # upload new screenshots, rewrite screenshots.url to blob URLs
```

`db:seed` clears and re-inserts `games` and `screenshots`, which resets every URL to a local
path — so `blob:migrate` must always run after it. `scores` is untouched by both.
`blob:migrate` skips rows that already hold an absolute URL, so re-running it is cheap.

## Screenshot Guidelines

- Format: WebP (optimized for web, smaller than PNG/JPG)
- Aspect ratio: 16:9 preferred (displayed with `aspect-video` or `aspect-[21/9]` in compact mode)
- Content: Gameplay screenshots that don't reveal the game name or year
- Avoid: Title screens, menus with visible game logos, screenshots with release date text
- The `scripts/fetch-screenshots.cjs` script can pull screenshots from the RAWG API

## Game Data Validation

- `id`: Unique integer, auto-incremented
- `name`: String, the game's official title
- `year`: Integer, the original release year (first platform)
- `screenshot`: In `games.json`, a path relative to `static/` starting with `/screenshots/`.
  In the database, the absolute Vercel Blob URL written by `blob:migrate`. Components resolve
  either form through `resolveScreenshotUrl()` in `src/lib/imageUrl.ts`

## Current Stats

- 125 games in the database
- Year range: 1972 (Pong) to 2023 (Baldur's Gate 3)
- All games have corresponding .webp files in static/screenshots/
- All 125 screenshots are also served from Vercel Blob (`screenshots/<slug>.webp`)
