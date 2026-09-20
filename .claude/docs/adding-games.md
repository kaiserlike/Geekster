# Adding Games to the Database

## Via the Admin Panel (preferred)

<https://geekster.pro/admin> — log in with `ADMIN_PASSWORD`, then either use the quick-add form on
the dashboard or `/admin/games/new`. Upload a screenshot or import one from RAWG and the game is
live immediately: the panel writes straight to the database and the blob store, and never touches
`games.json`. Bulk work goes through `/admin/games/import` (CSV or JSON, upserted by slug).

**A game is not live until it has a screenshot.** Both game APIs inner-join the primary
screenshot, so a game created without one exists in the database but never appears in a round.
The panel does not block that — it flags it: a red `NO SCREENSHOT` badge in the list, a banner
with the total, a `?missing=1` filter and a warning on the game's own page. A bulk import brings
no screenshots at all, so every imported game starts flagged.

## Via CLI (seed data)

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

`games.json` is only seed data — the running game reads from the database and has no fallback.
A new game is not live until both of these have run:

```bash
npm run db:seed -- --force   # upsert games.json into the database by slug
npm run blob:migrate         # upload new screenshots, rewrite screenshots.url to blob URLs
```

`db:seed` is an upsert, not a rebuild: it inserts games whose `slug` is missing, corrects a
changed `name` or `year`, and never deletes a row or reassigns an ID. A game that already has a
primary screenshot keeps its URL, so the absolute Vercel Blob URLs survive a re-seed. Only
screenshots it inserts itself point at a local path, which is why `blob:migrate` runs after.

Because a populated database may hold games created in the admin panel, `db:seed` refuses to run
against a non-empty `games` table unless you pass `--force`. Use `--dry-run` to see the plan
first. `scores` is untouched by both scripts. `blob:migrate` skips rows that already hold an
absolute URL, so re-running it is cheap.

The other way in is the admin panel at <https://geekster.pro/admin>, which writes straight to the
database and never touches `games.json`.

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
