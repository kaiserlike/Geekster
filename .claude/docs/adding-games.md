# Adding Games to the Database

## Via the Admin Panel (preferred)

<https://geekster.pro/admin> — log in with `ADMIN_PASSWORD`, then either use the quick-add form on
the dashboard or `/admin/games/new`. The panel writes straight to the database and the blob store,
and never touches `games.json`. Bulk work goes through `/admin/games/import` (CSV or JSON,
upserted by slug).

**`/admin/games/new` does the whole game in one pass.** Name, year and screenshot together: pick a
file, or search RAWG right there, preview a candidate at full size and choose it. A RAWG choice is
fetched and re-encoded to WebP immediately but held in the browser until the game exists, then
uploaded with it — there is no half-made game waiting for an image. Both pickers feed the same
single screenshot, so whichever was used last is the one that gets uploaded. If the upload fails
the game is still created and the panel sends you to its page with a warning, rather than back to
an empty form where a second submit would create it twice.

**A new game is a draft by default.** The "Create as draft" box is ticked on `/admin/games/new`,
on the dashboard quick-add and on the bulk import, so nothing reaches players before somebody has
looked at it. Publish it from the game's own page once it has been reviewed. The live rule is
**published AND has a primary screenshot** — a draft never appears in a round however complete it
looks, and the list shows an amber `DRAFT` badge plus a `?status=draft` filter.

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

The live count is not recorded here — it changes with every game published or deleted. The admin
dashboard (`/admin`) shows it; `/api/games` returns exactly what players get.

- `games.json` (seed data) holds 125 games, each with a `.webp` in `static/screenshots/`
- Production screenshots are served from Vercel Blob (`screenshots/<slug>.webp`)
