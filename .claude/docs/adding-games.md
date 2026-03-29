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
- `screenshot`: Path relative to `static/`, must start with `/screenshots/`

## Current Stats

- 125 games in the database
- Year range: 1972 (Pong) to 2023 (Baldur's Gate 3)
- All games have corresponding .webp files in static/screenshots/
