# Admin panel

The single-operator tool at `/admin`: auth, games, screenshots, the crop tool, scores, the
dashboard. English-only by design.

## Rules and behaviour

- **URL:** `/admin` (live: <https://geekster.pro/admin>). Login at `/admin/login`
- **Auth:** `ADMIN_PASSWORD` env var. `src/lib/server/auth.ts` compares it in constant time and
  signs a 12-hour session cookie with the password as the HMAC key — changing the password logs
  every session out. Without the variable the admin area is closed, not open. No rate limiting:
  a serverless function has no shared memory to count attempts in
- **Guard:** `src/hooks.server.ts` sets `locals.admin`, redirects `/admin/**` to the login page and
  answers `/api/admin/**` with 401
- **Draft mode (Sprint 7i-a).** `games.published` decides whether players ever see a game; the
  live rule is **published AND has a primary screenshot of the tier**. Creating a game defaults to a draft —
  the "Create as draft" box is ticked on `/admin/games/new`, the dashboard quick-add and the bulk
  import — because publishing should be a deliberate act, not the fallthrough. Publish and
  Unpublish sit on the game's own page. The column defaults to `1`, so the existing rows, `db:seed`
  and anything written before this sprint stay live exactly as they were
- **`DRAFT` is amber, `NO SCREENSHOT` is red, and they must never look alike.** One is a
  deliberate state, the other is a gap, and a game can carry both. The list has a
  `?status=draft|published` filter next to `?missing=normal|pro|both`, and the dashboard counts drafts
- **Two slots per game, Normal and Pro (Sprint 8 slice 2, migration `0003`).** A game can have a
  Normal shot, a Pro shot or both; a rare game may be Pro only. `screenshots.difficulty` is
  `normal | pro` (NOT NULL), and **"primary" is per (game, tier)** — enforced twice: by
  `reconcilePrimaries()` in `src/lib/screenshotTiers.ts`, which every mutation in `games.ts` runs
  after its row change, and by the partial unique index `screenshots_primary_per_difficulty`
  (`game_id, difficulty WHERE is_primary = 1`). A new or moved shot is written non-primary and
  becomes primary only in an empty tier, so adding a Pro shot never touches the Normal primary —
  unless the operator asks for it: the edit page's "Make it the … primary" box (shown only for a
  filled slot, ticked by default) sends `makePrimary=1`, and the action then runs
  `setPrimaryScreenshot()` on the new shot; the old one stays as an extra;
  deleting or moving a primary promotes the tier's oldest remaining shot. Flag writes go clears
  before sets in one `db.batch`, so the index never sees two
- **The edit page shows the two slots** (green `NORMAL`, blue `PRO` — never amber or red). Each shot
  has Make primary / Move to the other tier / Remove; the old per-shot difficulty `<select>` is
  gone. One upload area and one RAWG picker serve both, with an "Add to: Normal | Pro" toggle
  (`TierToggle.svelte`) that follows the first empty slot until the operator picks one. **On the
  edit page a shot is added the moment its crop is confirmed** ("Add to Pro"), from a file
  (`ScreenshotUpload`'s `onconfirm`) as from RAWG — there is no separate Upload button any more:
  a slice-3 tester cropped a file, never found that button, pressed the details form's Save (then
  a full-page POST, now enhanced) and lost the pick. A green note under the toggle says where the
  shot went and the new row is outlined. The details button reads "Save details". The create
  form has the same toggle, default Normal, and still holds the shot until "Create game". The list shows `NORMAL` / `PRO` chips, red
  `NO SCREENSHOT` only when both are empty, and slot filters `?missing=normal|pro|both` (the old
  `?missing=1` reads as `both`). The banner counts games **without a Normal shot**, since those
  are the ones players never see; the dashboard shows "Live · Normal", "Live · Pro" and "No Normal shot"
- **No join on `screenshots` in the admin list.** With two primaries a game would come back twice,
  so per-tier data is a correlated subquery on the game row. Those subqueries reference the outer
  row as `"games"."id"` explicitly: without a join Drizzle renders `${games.id}` as a bare `"id"`,
  which inside a subquery on `screenshots` binds to `screenshots.id` (found in testing — every
  thumbnail and count was another game's)
- **`screenshots.source_url`** holds the rawg.io URL a RAWG import came from (`RawgPicker` hands
  it over with the file; the server keeps it only if it passes the same rawg.io check as the
  proxy), null for a file. `crop_x/crop_y/crop_width/crop_height` exist since `0003` and are
  written by the crop tool (slice 3); null means a shot from before it
- **An admin upload never reuses a pathname, and never names the game.** `uploadScreenshot()`
  stores `screenshots/<random>.webp` (no overwrite). The slug is gone from it since Sprint 10a:
  the image URL is what a player sees before placing a card, and `<slug>-<random>.webp` gave
  the answer away. Deterministic names (`<slug>`, `<slug>-2`, …) had already been dropped in
  Sprint 8, because they collided across games and with the year-long cache. The slug still
  names the game in the admin URLs and is `db:seed`'s key
- **A game without a Normal screenshot is never served** today. A run's pool and `/api/admin/games` inner-join
  the primary screenshot of the requested tier, so such a game simply does not exist for players. Creation stays
  permissive (create first, pull a RAWG shot after), and the admin list flags the gap: a red badge
  per row, a banner with the total and a `?missing=1` filter
- **Game list:** the whole row opens the game; search fires on its own after 3 characters with a
  300 ms debounce (no Search button); sort, search and filter live in the URL and travel with the
  row click, so the detail page's prev/next chevrons walk that same list
- **Modals:** `ConfirmDialog.svelte` (delete) and `ImageLightbox.svelte` (screenshot at full size,
  from both the list and the detail page) wrap `bits-ui`'s dialog — focus trap, Escape and
  click-outside come from it. The lightbox takes an optional `actions` snippet and optional
  `onprevious`/`onnext`; the arrows and ← / → keys appear only when a caller passes them, so the
  plain viewers are unchanged
- **Screenshots:** uploaded straight to Vercel Blob. Every shot is cropped to 16:9 and re-encoded
  to WebP in the browser first (at most 1600×900, never scaled up) — see the crop step below. Deleting a game or screenshot deletes
  the blob too; local `/screenshots/...` paths (seed data) are left alone
- **RAWG:** the search button shows a spinner while the lookup runs, and an import disables every
  candidate tile until it finishes — a second click used to import the same screenshot twice.
  Extra screenshots are harmless: `addScreenshot()` only marks the first one primary and the game
  serves the primary alone
- **RAWG:** `RAWG_API_KEY` enables the screenshot picker (set for Production). Only `rawg.io` URLs
  can be fetched — the URL arrives from the browser and is untrusted, and
  `GET /api/admin/rawg/image` enforces that server-side before streaming the bytes back
- **A RAWG screenshot is previewed before it is chosen (Sprint 7i-c).** A candidate thumbnail
  opens the lightbox at full size rather than importing straight away — the tiles are small, it is
  easy to pick the wrong one, and an import is no longer cheap to undo now that it uploads.
  "Use this screenshot" in the lightbox runs the 7i-b flow; ← / → step through that candidate's
  shots without closing
- **The RAWG picker is a component, on the create form as well as the edit page (Sprint 7i-e).**
  `RawgPicker.svelte` owns everything up to the encoded WebP — search, preview, ← / →, the proxy
  fetch, `toWebp()` — and hands the file to a callback. Only the destination differs: the edit
  page POSTs it to `?/upload` at once, while `/admin/games/new` has no game to attach it to yet
  and holds it until the create submission carries it along. **The create form's RAWG search is
  an input and a button, not a `<form>`** — it renders inside the create form, and nested forms
  are invalid HTML; Enter in that box searches instead of submitting the game
- **The file picker and the RAWG picker feed one field, so they clear each other.** A game has one
  screenshot at creation; the last picker used is the one that is uploaded, and only one preview
  is ever on screen. `ScreenshotUpload` grew a `clear()` and an `onselect` callback for it
- **A failed screenshot on the create form does not strand the operator.** The game is created
  first, so the action redirects to its page with `?warning=<code>` instead of returning to the
  form, where a second submit would create the game twice. The codes are a closed set mapped to
  text server-side — nothing arbitrary from a URL is rendered on an admin page
- **One image pipeline (Sprint 7i-b, crop since Sprint 8 slice 3).** Every screenshot takes the
  same path: bytes into the browser, the crop step, `toWebp(blob, { crop })` from
  `src/lib/imageEncode.ts` (`drawImage` with the source rectangle), then the one `?/upload` action
  or the create action, with the rectangle riding along in the same post. The file
  picker and the RAWG import differ only in where the bytes come from. There is deliberately **no
  server-side import action** — a second code path is how the old asymmetry arose, where RAWG
  images were stored exactly as served (a full-size JPEG, ~200–500 kB against ~40 kB for the WebP)
  simply because they never passed through a browser
- **The crop step (Sprint 8 slice 3).** Both pickers, on the edit page and the create form, end in
  `ScreenshotCropper.svelte`: a fixed 16:9 window over the image, drag / pinch / wheel / slider /
  keys (arrows move, Shift faster, + / − zoom, 0 resets, Enter confirms). Hand-written, **not**
  `svelte-easy-crop` — it has no keyboard control, and its bindable position skips its own clamps
  (spike in `docs/history/08-normal-pro-crop-endless.md` § 8b). Every rule is pure in `src/lib/crop.ts` and unit-tested:
  - **default = the largest centred 16:9 area**, i.e. what `object-cover` showed before, so an
    untouched crop looks the same. It is **stored as a rectangle, not null** — for a 4:3 source it
    is a real cut, and it is the starting point of a later re-crop. Null means "before slice 3"
  - **output at most 1600×900, never scaled up; the tool will not zoom in past 640×360 source
    pixels; a warning below 960×540** (decision 3, 2026-09-27). A source whose largest 16:9 area is
    under 640 wide (many old RAWG and seed shots: 320×240, 600×337 …) is **locked** at that area —
    pan only, a red note — and can still be uploaded in either tier
  - the crop lives **inside the lightbox**, never in a second dialog: RAWG's "Use this screenshot"
    switches the open preview to crop view ("Back" returns), and a picked file opens the same
    lightbox straight into it. One focus trap; a click beside the stage does not close it
  - `crop_*` is posted as `cropX/cropY/cropWidth/cropHeight` + `sourceWidth/sourceHeight`
    (`appendCrop()`), and `parseCrop()` on the server treats it as untrusted: plain integers,
    inside the claimed source, 16:9 within a pixel of height, not under the minimum that source
    allows — otherwise dropped to null, the upload itself still stored (as `rawgSourceUrl()` does)
- **Re-crop (US-8.8).** "Crop again" on each shot opens `RecropDialog.svelte`, and the result either
  **replaces** that shot (same row, tier, primary flag and `source_url`; new blob, old blob deleted
  through the stage guard) or is **added as a new Normal or Pro shot** — so a Normal shot is the
  source of a Pro detail. What it crops from:
  - a RAWG shot (`source_url`): the original again, through the proxy, opening on the stored
    rectangle; the crop can widen. Posted with `cropBase=source`
  - an uploaded file or a seed/pre-slice-3 shot: only the stored WebP exists, so it is cropped —
    tighter only (`cropBase=stored`). `recropFromStored()` maps the result back into the
    original's pixels, scaling by the stored image's claimed size — bounded to 16:9 and no wider
    than the previous crop, and the result clamped inside it. **The stored WebP is not always
    `cropOutputSize(crop)`:** a replace from the stored image keeps the stored image's resolution
    (1323×744) while `crop_*` says 2117×1191 in the original. With no previous crop the stored
    image _is_ the source
  - it rides on `?/upload` as `recropOf=<shot id>` (+ `replace=1`); the server takes `source_url`
    from the row, never the form, and refuses a shot of another game
- **Activity (Sprint 10f):** the dashboard's "Last 7 days" tiles (`getActivity()` in
  `stats.ts`): runs started and finished, Daily players and Dailies finished (from `runs`),
  Daily and Endless shares and card downloads (from `share_counts`), and the Daily share rate
- **Scores (Sprint 10c):** `/admin/scores` lists every `scores` row newest first, with a mode
  filter and a name search, and deletes one (confirm dialog). A deleted row stays deleted; its
  run is kept, and the player's next best moves up on the board
- **Language:** the admin UI is English-only, deliberately — it is a single-operator tool

## Code map (from game-architecture.md)

```
/admin/login  --(password → HMAC cookie)-->  /admin/**        guarded by src/hooks.server.ts
                                             /api/admin/**    401 without a session
```

- `src/lib/server/auth.ts` — `ADMIN_PASSWORD` is both the credential and the HMAC key of the
  `<expiry>.<signature>` session cookie (12 hours). No session table, no rate limiting
- `src/lib/server/games.ts` — every read and write the panel performs; `slugify()`/`uniqueSlug()`
  own the slug (admin URLs, `db:seed`'s key — never a blob name)
- `src/lib/server/blob.ts` — every upload is `screenshots/<random>.webp`, a pathname that has
  never existed and doesn't name the game (Sprint 10a; `blob:migrate` does the same).
  Deleting a row deletes the blob unless the URL is a local path or another stage's
- `src/lib/server/rawg.ts` — search is proxied through `/api/admin/rawg`; only `rawg.io` images
  may be downloaded
- Two tiers, Normal and Pro (migration `0003`). Exactly one screenshot per **(game, tier)** is
  primary: `reconcilePrimaries()` (`src/lib/screenshotTiers.ts`) after every mutation, backed by
  a partial unique index. A run's pool (`POST /api/runs`) is the games with a primary of its
  mode's tier. A game without a Normal primary
  never reaches a round; the dashboard counts live games per tier
