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
│   │   ├── CoachMark.svelte        # First-run callout on the first card, above the slots (9e)
│   │   ├── CurrentCard.svelte      # The card to place (????), its phone strip, the touch floating card (9c, 9d)
│   │   ├── DecadeRuler.svelte      # Decade ruler beside the column, from 1280 px (9d)
│   │   ├── GameScreen.svelte       # Main gameplay: hosts HUD, card, timeline, bonus panel, reveal
│   │   ├── HowToPlay.svelte        # The six rules behind a disclosure on the welcome screen (9e)
│   │   ├── LangSwitch.svelte       # EN/DE language toggle (an IconButton)
│   │   ├── MultiplierLadder.svelte # The endless HUD: Card N, the 🔥 streak, the ×1.0–×1.5 ladder
│   │   ├── LegalPage.svelte        # Shell of the legal pages: back link, h1, last updated, prose styles (9g)
│   │   ├── ModeChoice.svelte       # Normal / Pro on SegmentedControl; Pro "Coming soon" below PRO_MIN_POOL
│   │   ├── Leaderboard.svelte      # Tabs per mode: this device, global (names, yours marked, link to /leaderboard), Classic
│   │   ├── DailyCard.svelte        # The welcome screen's Daily Run card: play / continue, or today's result (10d)
│   │   ├── DailyMarks.svelte       # A Daily Run's squares, one per card (10d)
│   │   ├── DailyProgress.svelte    # The Daily HUD: Card N / 10, a square per card, the 🔥 streak and ×chip
│   │   ├── PlayerNameForm.svelte   # The name field with the rules: result screen and /leaderboard (10c)
│   │   ├── ResultScreen.svelte     # Headline, score, stats, Play again / Menu, board, timeline with misses (9e)
│   │   ├── PlacementResult.svelte  # The card turned into its verdict; a pinned one-line ✗ on a miss (9d)
│   │   ├── RunHud.svelte           # The run's HUD: lives (a charging heart), MultiplierLadder or DailyProgress, score
│   │   ├── ScoreReveal.svelte      # The answer card with the round's breakdown (9d)
│   │   ├── ShareButton.svelte      # Share a result: share sheet (text + PNG) on a phone, clipboard + download elsewhere (10e)
│   │   ├── Timeline.svelte         # Slots, the miss's ghost, the ruler (9c, 9d; decade labels removed 2026-10-02)
│   │   ├── TimelineRow.svelte      # One placed game, year first: settled / hidden / placed / misplaced / missed (9d, 9e)
│   │   ├── TimelineSlot.svelte     # "Place here" drop target / button
│   │   ├── WelcomeScreen.svelte    # Wordmark, pitch or "welcome back", mode, START RUN, board, how to play (9e)
│   │   ├── brand/
│   │   │   └── OgImage.svelte      # The 1200×630 link preview, rendered into static/og-image.png
│   │   ├── ui/                     # Design-system primitives (Sprint 9b), shown on /styleguide
│   │   │   ├── Button.svelte            # primary / secondary / ghost, sm 44 · md 52 · lg 56, loading
│   │   │   ├── Lightbox.svelte          # A screenshot at full size, 16:9, bits-ui dialog (9d)
│   │   │   ├── Chip.svelte              # accent, pink, neutral, multiplier, mystery (????)
│   │   │   ├── HorizonGrid.svelte       # The synthwave floor: decoration, never behind text
│   │   │   ├── IconButton.svelte        # 44 px square, `label` required (aria-label)
│   │   │   ├── IconMark.svelte          # The "G" app icon at any size: favicon, touch, maskable
│   │   │   ├── SegmentedControl.svelte  # Radio group as segments (ModeChoice since 9e)
│   │   │   ├── Surface.svelte           # Opaque panel: surface / raised / sunken, line / magenta / danger frame
│   │   │   ├── TextField.svelte         # Labelled input with hint and error, never type=number
│   │   │   ├── Wordmark.svelte          # GEEKSTER with the RGB split, flat variant, tagline
│   │   │   └── icons/                   # Heart (full / empty / socket, charging / broken), CreditCoin (CR), Flame (a streak)
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
│   │   ├── runRules.ts             # The referee's pure rules: place, scoreBonus, advance (10b, tested)
│   │   ├── runs.ts                 # The referee: a run's row, conditional writes, the score at the end (10b, tested)
│   │   ├── daily.ts                # Today's Daily set (written once), a device's Daily run, its rank and status (10d)
│   │   ├── scores.ts               # The global board: best per device, standing, naming a score, admin list/delete (10c, tested)
│   │   ├── schema.ts               # Drizzle schema: games, screenshots, scores, runs, daily_challenges, share_counts
│   │   ├── shareCounts.ts          # countShare(): today's anonymous share count per kind and method (10f)
│   │   ├── testDb.ts               # Tests only: in-memory libSQL with drizzle/ applied, stands in for db.ts; seed helpers
│   │   └── stats.ts                # Dashboard counts, the last 7 days' runs and shares (10f), recent activity
│   ├── adminList.ts                # Game-list sort/search/filter query, shared by the admin pages
│   ├── brand.ts                    # The brand assets `brand:render` writes into static/ (id, size, output)
│   ├── crop.ts                     # Pure 16:9 crop rules: default, clamp, zoom, output size, parseCrop(), re-crop mapping
│   ├── decadeRuler.svelte.ts       # DecadeRulerState: when the ruler shows, the decade in view, the jump (9f)
│   ├── dragPlace.svelte.ts         # DragPlace: HTML5 + touch drag onto a slot, long-press, auto-scroll of the page (9c, 9d)
│   ├── firstRun.ts                 # The coach mark's flag: localStorage `geekster-coach-seen` (9e)
│   ├── game.svelte.ts              # Core game state machine (Svelte 5 runes), the client of /api/runs (10b)
│   ├── daily.ts                    # The Daily Run's pure rules: UTC day, #N, pickDaily(), dailyStreak(), dailyProgress() (10d, tested)
│   ├── globalBoard.ts              # The board's pure rules: periods, weekStart(), pages, parseDeviceId() (10c, tested)
│   ├── headerScore.svelte.ts       # The HUD collapsed into the app header during the bonus keyboard (9d)
│   ├── imageEncode.ts              # Browser crop + WebP re-encode at ≤ 1600px, shared by all uploads
│   ├── imageUrl.ts                 # resolveScreenshotUrl(): absolute blob URL vs. local path
│   ├── i18n.svelte.ts              # Internationalization (EN/DE translations)
│   ├── index.ts                    # Barrel exports
│   ├── leaderboard.ts              # localStorage leaderboard CRUD, one list per mode; hasPlayedBefore()
│   ├── legal.ts                    # Operator details, TAKEDOWN_DAYS, LEGAL_UPDATED for the legal pages (9g)
│   ├── motion.ts                   # DURATION, EASE, cubicBezier(); fade/fly/slide/scale that honour reduced motion
│   ├── modes.ts                    # PRO_MIN_POOL, the gate rule and its override, the stored mode
│   ├── player.svelte.ts            # This browser on the board: `geekster-device-id`, `geekster-player-name` (10c)
│   ├── playerName.ts               # checkName(): the name rules and block list, browser and server (10c, tested)
│   ├── placement.ts                # Pure placement rules: slot check, auto-insert index, streakMeter(), hudMoment()
│   ├── scoring.ts                  # Score calculation (year, name, streak), Normal and Pro
│   ├── share.ts                    # The share text and the share card's copy, EN/DE (10e, tested)
│   ├── shareCard.ts                # renderShareCard(): the 1200×630 result PNG, drawn on a canvas in the browser (10e)
│   ├── screenshotTiers.ts          # Normal/Pro values + reconcilePrimaries(): one primary per tier
│   ├── *.test.ts                   # Vitest: the pure rules; server/runs and server/scores against an in-memory database
│   └── types.ts                    # Shared TypeScript types
├── hooks.server.ts                 # Admin session guard, noindex outside production, server-rendered <html lang>
├── routes/
│   ├── admin/
│   │   ├── +layout.svelte          # Sidebar shell (skipped on the login page)
│   │   ├── +page.svelte            # Dashboard: stat tiles, quick add, recent scores
│   │   ├── +page.server.ts         # Dashboard load + quickAdd action
│   │   ├── login/                  # +page.svelte / +page.server.ts (form action)
│   │   ├── logout/+server.ts       # POST — clears the session cookie
│   │   ├── scores/                 # Every score row, newest first: mode filter, name search, delete (10c)
│   │   └── games/
│   │       ├── +page.svelte/.server.ts       # List: search, sort, NORMAL/PRO chips, slot filter, delete
│   │       ├── new/                          # Create a game (+ optional screenshot)
│   │       ├── import/                       # Bulk CSV/JSON upsert by slug
│   │       └── [id]/                         # Edit details, prev/next, Normal + Pro screenshot slots
│   ├── api/
│   │   ├── admin/games/+server.ts       # GET  — live games of one tier with name + year (admin only since 10b)
│   │   ├── admin/rawg/+server.ts        # GET  — RAWG screenshot search (admin only)
│   │   ├── daily/+server.ts             # GET  — today's Daily Run for a device: #N, streak, its run of today (10d)
│   │   ├── runs/+server.ts              # POST — start a run: anchor + first card as an image (10b)
│   │   ├── runs/[id]/place|bonus|next/  # POST — the referee's three moves (10b)
│   │   ├── runs/[id]/name/+server.ts    # POST — names a finished run's Anonymous score (10c)
│   │   ├── share/+server.ts             # POST — counts a share: {kind, method}, anonymous (10f)
│   │   └── scores/+server.ts            # GET  — the global board: best per device, ?difficulty&period&page&device (10c)
│   ├── impressum/                  # Impressum (§ 5 ECG, § 25 MedienG), DE binding + EN (9g)
│   ├── leaderboard/                # The global board: mode, all-time / this week, pages, your row, your name (10c)
│   ├── privacy/                    # Privacy policy EN/DE, lists every localStorage key (9g)
│   ├── styleguide/                 # Living styleguide (noindex, linked nowhere): every primitive, every state
│   │   └── brand/
│   │       ├── [asset]/            # One brand asset per page at its exact pixel size, no chrome
│   │       └── assets.json/        # GET — the list from brand.ts, read by render-brand-assets.cjs
│   ├── +layout.svelte              # Root layout: fonts, favicon links, link-preview meta, AppHeader, legal footer; admin keeps its own chrome
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
├── pull_request_template.md        # The release PR: what ships, the migration questions
└── workflows/
    ├── ci.yml                      # CI gate: lint, format:check, svelte-check, Vitest, build
    └── migrate.yml                 # develop → staging, main → production: migrate, then db:check
scripts/
├── check-database.js               # db:check — integrity, foreign keys, migrations recorded (read-only)
├── convert-screenshots.cjs         # Convert screenshot image formats
├── fetch-screenshots.cjs           # Download screenshots from RAWG API
├── generate-placeholders.cjs       # Generate SVG placeholder images
├── import-games.cjs                # CLI: add/list games in games.json
├── db-target.js                    # Resolves local/staging/production to a URL + token, guarded
├── dump-database.js                # Timestamped JSON backup of every table into backups/
├── refresh-staging.js              # One-way production → staging copy (games + screenshots)
├── load-env.js                     # Shared .env loader (strips quoted values)
├── migrate-screenshots-to-blob.js  # Upload screenshots to Vercel Blob, rewrite DB URLs
├── rename-screenshot-blobs.js      # One-off (10a): random blob names, URL rewrite, old file deleted
├── render-brand-assets.cjs         # brand:render — screenshots /styleguide/brand/* into static/ (laptop only)
├── seed-database.js                # Upsert games.json into Turso (never deletes)
└── stamp-migrations.js             # Record a migration as applied without running its SQL
drizzle/                            # Migration history — the only thing that creates a table
├── 0000_baseline.sql               # The pre-existing schema; stamped into all three databases
├── 0001_ … 0003_*.sql              # published, created_at rebuild, normal | pro rebuild
├── 0004_runs.sql                   # `runs`; `scores.run_id` (unique) + `device_id` (10b)
├── 0005_daily.sql                  # `daily_challenges`; `runs.daily_date` + `marks`, one Daily per device; `scores.daily_date` (10d)
├── 0006_share_counts.sql           # `share_counts`: shares per UTC day, kind and method (10f)
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

Hosting, stages, env vars and secrets: `docs/runbooks/environments.md`. Branching, CI and
releases: `docs/runbooks/release.md`.

## Documents and agent configuration

```
CLAUDE.md                           # Loaded into every Claude session: stack, commands, conventions, invariants (≤ 250 lines)
PLAN.md                             # Status, the current milestone in full, the next ones in outline
ROADMAP.md                          # Vision, Now / Next / Later, ideas, risks
CHANGELOG.md                        # One line per production release
README.md                           # For a human arriving at the repo: setup, commands, API
docs/
├── decisions.md                    # The decision log
├── architecture/                   # How it works today: project-structure, game-rules, game-architecture, frontend, admin-panel
├── runbooks/                       # How to operate it: environments, release, schema-migrations, adding-games
└── history/                        # Finished milestones, one file per number; README.md = index + naming
.claude/
├── rules/                          # Coding rules Claude follows: architecture, testing, code-style, svelte5-runes, documentation, quality-checks
├── skills/wrap-up/SKILL.md         # /wrap-up — the end-of-session checklist
├── hooks/docs-sync-guard.sh        # Before `git commit`: docs touched? CLAUDE.md within budget?
└── settings.json                   # Registers the hook
scratchpad/                         # Gitignored agent working area (drivers in cdp/, temporary notes); cleaned at /wrap-up
backups/                            # Gitignored `db:dump` snapshots
```
