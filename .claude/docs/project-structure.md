# Project Structure (Current)

```
src/
├── app.css                         # Tailwind v4 + the design tokens in @theme (Sprint 9b), focus-ring, tabular
├── app.d.ts                        # SvelteKit type declarations
├── app.html                        # HTML shell; `lang="%lang%"` is filled by hooks.server.ts
├── lib/
│   ├── components/                 # UI components
│   │   ├── AppHeader.svelte        # Wordmark, PRO badge during a Pro run, language switch (9b)
│   │   ├── BonusGuessPanel.svelte  # Year/name bonus guess: 30 s, announced at 10 and 5 s (9d)
│   │   ├── CurrentCard.svelte      # The card to place (????), its phone strip, the touch floating card (9c, 9d)
│   │   ├── FeedbackToast.svelte    # The placement feedback after each card (9c)
│   │   ├── DecadeRuler.svelte      # Desktop decade ruler beside the timeline pane (9d)
│   │   ├── GameCard.svelte         # Screenshot card, only the result screen's timeline until 9e
│   │   ├── GameScreen.svelte       # Main gameplay: hosts HUD, card, timeline, bonus panel, reveal
│   │   ├── LangSwitch.svelte       # EN/DE language toggle (an IconButton)
│   │   ├── ModeChoice.svelte       # Normal / Pro choice; Pro "Coming soon" below PRO_MIN_POOL
│   │   ├── Leaderboard.svelte      # Top scores per mode: local, global (?difficulty=), Classic
│   │   ├── ResultScreen.svelte     # Win/loss screen with score + leaderboard
│   │   ├── RunHud.svelte           # The run's HUD: lives, streak meter, score (9c)
│   │   ├── ScoreReveal.svelte      # The answer card with the round's breakdown (9d)
│   │   ├── StreakMeter.svelte      # The streak bar: multiplier, way to the next life (9c)
│   │   ├── Timeline.svelte         # Slots, decade labels, the miss's ghost, the desktop pane (9c, 9d)
│   │   ├── TimelineRow.svelte      # One placed game, year first: settled / hidden / placed / misplaced (9d)
│   │   ├── TimelineSlot.svelte     # "Place here" drop target / button
│   │   ├── WelcomeScreen.svelte    # Start screen with rules, mode choice, language switch
│   │   ├── brand/
│   │   │   └── OgImage.svelte      # The 1200×630 link preview, rendered into static/og-image.png
│   │   ├── ui/                     # Design-system primitives (Sprint 9b), shown on /styleguide
│   │   │   ├── Button.svelte            # primary / secondary / ghost, sm 44 · md 52 · lg 56, loading
│   │   │   ├── Lightbox.svelte          # A screenshot at full size, 16:9, bits-ui dialog (9d)
│   │   │   ├── Chip.svelte              # accent, pink, neutral, multiplier, mystery (????)
│   │   │   ├── HorizonGrid.svelte       # The synthwave floor: decoration, never behind text
│   │   │   ├── IconButton.svelte        # 44 px square, `label` required (aria-label)
│   │   │   ├── IconMark.svelte          # The "G" app icon at any size: favicon, touch, maskable
│   │   │   ├── SegmentedControl.svelte  # Radio group as segments (what ModeChoice becomes in 9e)
│   │   │   ├── Surface.svelte           # Opaque panel: surface / raised / sunken, line / magenta / danger frame
│   │   │   ├── TextField.svelte         # Labelled input with hint and error, never type=number
│   │   │   ├── Toast.svelte             # Polite live region: correct ✓, wrong ✗, life ♥, streak ★
│   │   │   ├── Wordmark.svelte          # GEEKSTER with the RGB split, flat variant, tagline
│   │   │   └── icons/                   # Heart (full / empty / socket), CreditCoin (CR)
│   │   └── admin/
│   │       ├── ConfirmDialog.svelte     # bits-ui modal for destructive actions
│   │       ├── ImageLightbox.svelte     # bits-ui modal: screenshot at full size, or the crop step
│   │       ├── RawgPicker.svelte        # RAWG search + preview + crop; hands back a WebP
│   │       ├── RecropDialog.svelte      # "Crop again" on an existing shot: replace or add a new one
│   │       ├── ScreenshotCropper.svelte # The 16:9 crop step (drag, pinch, wheel, keys)
│   │       ├── ScreenshotUpload.svelte  # File picker: crop step, then WebP at ≤ 1600px
│   │       ├── Spinner.svelte           # Inline loading spinner
│   │       └── TierToggle.svelte        # Normal / Pro radio pair: which slot a shot goes into
│   ├── data/
│   │   ├── README.md               # Why games.json is seed data and who reads it
│   │   └── games.json              # 125 games — seed data for db:seed, never loaded at runtime
│   ├── server/                     # Server-only (never imported from a component)
│   │   ├── auth.ts                 # Admin password check + HMAC session cookie
│   │   ├── blob.ts                 # Vercel Blob upload/delete (token passed explicitly)
│   │   ├── db.ts                   # Lazy Drizzle client over Turso (libSQL)
│   │   ├── games.ts                # Game/screenshot CRUD for the admin panel (primary per tier)
│   │   ├── liveGames.ts            # Live games and their count per tier, the Pro gate (getProGate)
│   │   ├── rawg.ts                 # RAWG search + image download (rawg.io only)
│   │   ├── schema.ts               # Drizzle schema: games, screenshots, scores
│   │   └── stats.ts                # Dashboard counts and recent activity
│   ├── adminList.ts                # Game-list sort/search/filter query, shared by the admin pages
│   ├── brand.ts                    # The brand assets `brand:render` writes into static/ (id, size, output)
│   ├── crop.ts                     # Pure 16:9 crop rules: default, clamp, zoom, output size, parseCrop(), re-crop mapping
│   ├── dragPlace.svelte.ts         # DragPlace: HTML5 + touch drag onto a slot, long-press, auto-scroll of page or pane (9c, 9d)
│   ├── game.svelte.ts              # Core game state machine (Svelte 5 runes)
│   ├── headerScore.svelte.ts       # The HUD collapsed into the app header during the bonus keyboard (9d)
│   ├── imageEncode.ts              # Browser crop + WebP re-encode at ≤ 1600px, shared by all uploads
│   ├── imageUrl.ts                 # resolveScreenshotUrl(): absolute blob URL vs. local path
│   ├── i18n.svelte.ts              # Internationalization (EN/DE translations)
│   ├── index.ts                    # Barrel exports
│   ├── leaderboard.ts              # localStorage leaderboard CRUD, one list per mode
│   ├── motion.ts                   # DURATION, EASE, cubicBezier(); fade/fly/slide/scale that honour reduced motion
│   ├── modes.ts                    # PRO_MIN_POOL, the gate rule and its override, the stored mode
│   ├── placement.ts                # Pure placement rules: slot check, auto-insert index, streakMeter(), hudMoment()
│   ├── scoring.ts                  # Score calculation (year, name, streak), Normal and Pro
│   ├── screenshotTiers.ts          # Normal/Pro values + reconcilePrimaries(): one primary per tier
│   ├── *.test.ts                   # Vitest unit tests (scoring, placement, tiers, admin list, crop, motion)
│   └── types.ts                    # Shared TypeScript types
├── hooks.server.ts                 # Admin session guard, noindex outside production, server-rendered <html lang>
├── routes/
│   ├── admin/
│   │   ├── +layout.svelte          # Sidebar shell (skipped on the login page)
│   │   ├── +page.svelte            # Dashboard: stat tiles, quick add, recent scores
│   │   ├── +page.server.ts         # Dashboard load + quickAdd action
│   │   ├── login/                  # +page.svelte / +page.server.ts (form action)
│   │   ├── logout/+server.ts       # POST — clears the session cookie
│   │   └── games/
│   │       ├── +page.svelte/.server.ts       # List: search, sort, NORMAL/PRO chips, slot filter, delete
│   │       ├── new/                          # Create a game (+ optional screenshot)
│   │       ├── import/                       # Bulk CSV/JSON upsert by slug
│   │       └── [id]/                         # Edit details, prev/next, Normal + Pro screenshot slots
│   ├── api/
│   │   ├── admin/rawg/+server.ts        # GET  — RAWG screenshot search (admin only)
│   │   ├── games/+server.ts             # GET  — live games of one tier (?difficulty=normal|pro)
│   │   ├── games/random/+server.ts      # GET  — shuffled live games (`count` ≤ 1000; solo takes the whole pool)
│   │   └── scores/+server.ts            # GET/POST — global leaderboard (?difficulty=; no Pro while gated)
│   ├── styleguide/                 # Living styleguide (noindex, linked nowhere): every primitive, every state
│   │   └── brand/
│   │       ├── [asset]/            # One brand asset per page at its exact pixel size, no chrome
│   │       └── assets.json/        # GET — the list from brand.ts, read by render-brand-assets.cjs
│   ├── +layout.svelte              # Root layout: fonts, favicon links, link-preview meta, AppHeader; admin keeps its own chrome
│   ├── +layout.ts                  # Layout config (trailing slash)
│   ├── +page.server.ts             # Load: the Pro gate for the welcome screen (one COUNT)
│   └── +page.svelte                # Main page (phase-based component routing)
static/
├── robots.txt
├── favicon.ico, favicon-16.png, favicon-32.png  # Generated by `npm run brand:render`, committed
├── apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png
├── og-image.png                    # 1200×630 link preview, a PNG under 300 kB (not WebP)
├── site.webmanifest                # name, icons, colours; display stays `browser`
└── screenshots/                    # 125 .webp game screenshot images
.github/
└── workflows/
    └── ci.yml                      # CI gate: lint, format:check, svelte-check, Vitest, build
scripts/
├── convert-screenshots.cjs         # Convert screenshot image formats
├── fetch-screenshots.cjs           # Download screenshots from RAWG API
├── generate-placeholders.cjs       # Generate SVG placeholder images
├── import-games.cjs                # CLI: add/list games in games.json
├── db-target.js                    # Resolves local/staging/production to a URL + token, guarded
├── dump-database.js                # Timestamped JSON backup of every table into backups/
├── refresh-staging.js              # One-way production → staging copy (games + screenshots)
├── load-env.js                     # Shared .env loader (strips quoted values)
├── migrate-screenshots-to-blob.js  # Upload screenshots to Vercel Blob, rewrite DB URLs
├── render-brand-assets.cjs         # brand:render — screenshots /styleguide/brand/* into static/ (laptop only)
├── seed-database.js                # Upsert games.json into Turso (never deletes)
└── stamp-migrations.js             # Record a migration as applied without running its SQL
drizzle/                            # Migration history — the only thing that creates a table
├── 0000_baseline.sql               # The pre-existing schema; stamped into all three databases
└── meta/
    ├── 0000_snapshot.json          # Drizzle's schema snapshot, diffed by the next db:generate
    └── _journal.json               # Migration index — tag + `when`, which orders the runs
```

## Config Files

- `svelte.config.js` — `@sveltejs/adapter-vercel`, no base path
- `vite.config.ts` — Tailwind CSS v4 + SvelteKit plugins, plus the Vitest `test` block (`src/**/*.test.ts`, node)
- `eslint.config.js` — Flat config, svelte + typescript-eslint
- `.prettierrc` — Tabs, single quotes, no trailing commas, svelte + tailwind plugins
- `tsconfig.json` — Strict mode, bundler module resolution
- `drizzle.config.ts` — Drizzle Kit, dialect `turso`. Resolves its database from `DB_TARGET`
  (`local` by default, or `staging` / `production`) through `scripts/db-target.js`, so a migration
  never needs `.env` edited. The resolver supplies a placeholder `authToken` for `file:` URLs: the
  `turso` dialect validates it as a required non-empty string, but @libsql/client never sends it
  for a local file, so without the placeholder the local target could not be migrated at all

## Deployment

- **Target**: Vercel — <https://geekster.pro> (`www` 308-redirects to the apex)
- **Adapter**: `@sveltejs/adapter-vercel` (SSR + API routes; nothing is prerendered)
- **Base path**: none
- **CI/CD**: Vercel builds on every push to `main`; there is no GitHub Actions workflow
- **DNS**: registrar IONOS, A records for apex and `www` point at Vercel. Nameservers stay with IONOS
- **Env vars**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`,
  `ADMIN_PASSWORD` and the optional `RAWG_API_KEY`. Set in the Vercel dashboard and mirrored in a
  local `.env` for the node scripts (see `scripts/load-env.js`). Claude Code cannot write Vercel
  environment variables — that step is manual
