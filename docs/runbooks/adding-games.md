# Adding Games to the Database

## Via the Admin Panel (preferred)

<https://geekster.pro/admin> — log in with `ADMIN_PASSWORD`, then either use the quick-add form on
the dashboard or `/admin/games/new`. The panel writes straight to the database and the blob store,
and never touches `games.json`. Bulk work goes through `/admin/games/import` (CSV or JSON,
upserted by slug).

**`/admin/games/new` does the whole game in one pass.** Name, year and screenshot together: pick a
file, or search RAWG right there, preview a candidate at full size and choose it. Either way the
image then goes through the **crop step** (below). A RAWG choice is fetched, cropped and
re-encoded to WebP immediately but held in the browser until the game exists, then
uploaded with it — there is no half-made game waiting for an image. Both pickers feed the same
single screenshot, so whichever was used last is the one that gets uploaded. If the upload fails
the game is still created and the panel sends you to its page with a warning, rather than back to
an empty form where a second submit would create it twice.

**A new game is a draft by default.** The "Create as draft" box is ticked on `/admin/games/new`,
on the dashboard quick-add and on the bulk import, so nothing reaches players before somebody has
looked at it. Publish it from the game's own page once it has been reviewed. The live rule is
**published AND has a primary screenshot of the tier** — a draft never appears in a round however complete it
looks, and the list shows an amber `DRAFT` badge plus a `?status=draft` filter.

**Two slots: Normal and Pro (Sprint 8).** A game can have a Normal shot, a Pro shot, or both — a
little-known game may be Pro only. Pro is the harder picture: a HUD corner, a texture, a detail
— cut from any screenshot in seconds with the crop step. The game page shows both slots; the one
upload area and the RAWG picker have an "Add to: Normal | Pro" toggle that follows the first empty
slot, and `/admin/games/new` has the same toggle (default Normal). Each slot has one primary — the
shot that is served. On a game's page a shot is added the moment its crop is confirmed — no
separate save — and into a slot that already has one it becomes the new primary while the box
"Make it the … primary" is ticked (the default; the old shot stays as an extra), or an extra if you
untick it. A green note says which. In an empty slot a new shot is always primary, "Make primary" works
within its slot, and "Move to Pro/Normal" never displaces the other slot's primary. A RAWG import
records the rawg.io URL it came from (`source_url`).

**Every screenshot is cropped to 16:9 before it is uploaded (Sprint 8 slice 3).** Picking a file,
or pressing "Use this screenshot" on a RAWG candidate, opens the crop step: a 16:9 window over the
image. Drag or use the arrow keys to move it (Shift: faster), wheel, pinch, the slider or + / − to
zoom, 0 to reset, Enter to confirm. It opens on the largest centred 16:9 area — exactly what the
card showed before — so confirming without touching it changes nothing. Only the cropped part is
stored, at most 1600×900 and never scaled up, and the rectangle is recorded in `crop_*` (in the
source's pixels). The readout shows the output size live:

- the tool will not zoom in past **640×360** source pixels — a Pro detail below that is pixel soup
- below **960×540** it warns that the shot will look soft on large screens
- an image too small to hold 640×360 in 16:9 (old RAWG shots, e.g. 320×240) is locked at its
  largest 16:9 area with a red note; it can still be uploaded, pan only
- use it on Normal shots too, to cut a logo or a watermark off an edge

On `/admin/games/new`, "Crop again" under the preview reopens the crop until the game is created;
on a game's own page the shot is already added, so use the shot's own "Crop again" instead.

**An existing shot can be cropped again (US-8.8).** "Crop again" on a shot of the game's page opens
the same crop step, and the result either replaces that shot (it stays primary if it was) or is
added as a new Normal or Pro shot — the quick way to cut a Pro detail out of a Normal shot. A RAWG
shot is cropped from its original again, so the crop can also widen; an uploaded file or an old
seed shot kept only its stored image, so there the crop can only get tighter.

**A game is not live until it has a Normal screenshot.** Both game APIs inner-join the primary
screenshot of the requested tier (`?difficulty=`, default `normal`) — so a game with no shot
exists in the database but never appears in a round, and a game with a Pro shot only appears in
Pro alone. **Pro is offered once 100 games are live in it** (`PRO_MIN_POOL`, `src/lib/modes.ts`);
until then every Pro shot added counts toward opening it, and the gate opens by itself. The panel does not block that — it flags it: `NORMAL` /
`PRO` chips per row, a red `NO SCREENSHOT` badge when both slots are empty, a banner with the
number of games without a Normal shot, filters `?missing=normal|pro|both` and a warning on the
game's own page. A bulk import brings no screenshots at all, so every imported game starts
flagged.

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
primary Normal screenshot keeps its URL (seed shots are always Normal), so the absolute Vercel Blob URLs survive a re-seed. Only
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
dashboard (`/admin`) shows it; `/api/admin/games` (admin session) returns exactly what players get.

- `games.json` (seed data) holds 125 games, each with a `.webp` in `static/screenshots/`
- Production screenshots are served from Vercel Blob as `screenshots/<random>.webp`, from
  `blob:migrate` and every admin upload alike. The name never carries the slug (Sprint 10a): the
  image URL reaches the player before the card is placed
