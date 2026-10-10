# Geekster

A timeline guessing game for video game screenshots. You get a screenshot and have to place it
chronologically against the games already on your timeline — like the card game Hitster, but with
video games instead of songs.

Live at **<https://geekster.pro>**.

## Stack

- **SvelteKit** (Svelte 5 runes) + TypeScript, **Tailwind CSS v4**
- **bits-ui** for the dialogs: the admin panel's confirm and screenshot lightbox, the game's card lightbox
- **Turso** (libSQL/SQLite) via **Drizzle ORM** — games, screenshots, scores
- **Vercel Blob** for the screenshot images
- Hosted on **Vercel** (SSR + API routes)
- Design tokens in `src/app.css` (`@theme`), primitives in `src/lib/components/ui/`, and a living
  styleguide at `/styleguide` (Sprint 9). Fonts (Dela Gothic One, Chakra Petch, Exo 2) are
  self-hosted through `@fontsource`, never loaded from Google. The admin panel shares the body
  font and the accent colour and keeps its own layout and status colours

## Getting Started

```sh
npm install
cp .env.example .env    # fill in the Turso and Blob credentials
npm run dev
```

The database is required — there is no offline fallback. If the API cannot serve a round, the
player sees an error and can retry. To get a local database going, point `TURSO_DATABASE_URL` at
`file:local.db`, then:

```bash
npm run db:migrate   # creates the tables from drizzle/
npm run db:seed      # loads the 125 games from src/lib/data/games.json
```

In that order — `db:seed` only fills tables, it no longer creates them. Screenshots are then
served from `static/screenshots/`.

## Commands

| Command                                | Purpose                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                          | Dev server                                                                       |
| `npm run build` / `npm run preview`    | Production build and local preview                                               |
| `npm run lint` / `npm run check`       | ESLint / svelte-check                                                            |
| `npm run test`                         | Vitest unit tests (`test:watch` to keep them running)                            |
| `npm run verify`                       | The full gate as CI runs it: lint, format:check, check, test, build              |
| `npm run format`                       | Prettier                                                                         |
| `npm run game:add "Name" 2023`         | Add a game to `games.json`                                                       |
| `npm run game:list`                    | List games by year                                                               |
| `npm run db:generate`                  | Generate a migration in `drizzle/` from the Drizzle schema                       |
| `npm run db:migrate`                   | Apply pending migrations locally (`file:local.db`)                               |
| `npm run db:migrate:staging`           | Apply them to staging                                                            |
| `npm run db:migrate:production`        | Apply them to production                                                         |
| `npm run db:check -- --target=<stage>` | Integrity, foreign keys, every migration recorded (read-only)                    |
| `npm run db:dump -- --target=<stage>`  | JSON snapshot of every table into `backups/` (gitignored)                        |
| `npm run db:refresh-staging`           | Replace staging's games and screenshots with production's                        |
| `npm run db:seed`                      | Upsert `games.json` into the database by slug (`--force`, `--dry-run`)           |
| `npm run db:studio`                    | Browse the database                                                              |
| `npm run blob:migrate`                 | Upload screenshots to Vercel Blob, rewrite DB URLs                               |
| `npm run brand:render`                 | Render favicons, app icons and the OG image into `static/` (needs `npm run dev`) |

Run `npm run verify` before committing — see `.claude/rules/quality-checks.md`. CI runs the same
five steps on every pull request and on pushes to `main` and `develop`.

## Schema changes

`drizzle/` holds the migration history and is the only thing that creates or alters a table.
`db:push` is deliberately not available — it changes a database without leaving a record, which
is how the three databases drifted apart before Sprint 7h.

1. Edit `src/lib/server/schema.ts`
2. `npm run db:generate` — review the generated `.sql` like code and commit it with the change
3. A push to `develop` migrates staging (`.github/workflows/migrate.yml`)
4. The release merge migrates production; Vercel deploys it only once that is green

Each stage is named, so nothing has to be uncommented in `.env` and nothing has to be put back
afterwards. `TURSO_DATABASE_URL` — what the application reads — stays at `file:local.db`, which is
what stops the local admin panel from reaching production while a migration is applied to it.

GitHub Actions applies them, with credentials scoped to one GitHub environment per stage, and
Vercel holds a production deploy until its migration is green.

Read the generated SQL before committing it — a default written as a JavaScript string becomes a
quoted literal, and SQLite emits a table rebuild where other databases would `ALTER`.

**Expand, then contract.** Never drop a column in the same release that changes the code using it,
so that rolling the application back never strands the database. Adding a column with a default is
the safe single-release case.

`0000_baseline.sql` describes the schema as it already existed. The three databases were stamped
as having run it (`npm run db:stamp -- --target=<stage>`) rather than actually running it, since
their tables were already there. Stamping is a one-off for the baseline — everything after it is
a normal `db:migrate`.

Full runbook, including how to point a migration at a live database and the drift between
production and staging: **`docs/runbooks/schema-migrations.md`**.

## Deployment

| Branch    | Builds     | URL                            |
| --------- | ---------- | ------------------------------ |
| `main`    | Production | <https://geekster.pro>         |
| `develop` | Staging    | <https://staging.geekster.pro> |
| other     | Preview    | generated `*.vercel.app` URL   |

Vercel's Git integration does the deploying — there is no deploy workflow and no `VERCEL_TOKEN`
in GitHub. `.github/workflows/migrate.yml` migrates the stage a branch deploys to; `ci.yml` only gates: lint, format, svelte-check, Vitest and build. `main`
requires a passing PR. Work is committed on `develop` directly (solo project), tested on staging,
then released by a `develop` → `main` PR; afterwards `develop` is fast-forwarded to `main`.
Details, hotfixes and when a feature branch is still worth it: `docs/runbooks/release.md`.

Staging and preview share one Vercel Preview environment (Custom Environments are a Pro feature),
so they read the same staging database. Both sit behind Vercel Authentication — the protection
exemption for custom domains applies to the production domain only — so `staging.geekster.pro`
needs a Vercel login. Screenshots uploaded outside production land under a
`staging/` prefix in the same blob store, which keeps them from overwriting production images.

## API

| Route                              | Purpose                                                                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/daily?device=<id>`       | Today's Daily Run: its number, the time until the next, the device's day streak and its run of today (none, unfinished, or the result with its rank)                                                   |
| `POST /api/runs`                   | Start a run, `{ mode, deviceId }` (`mode: 'daily'` starts or resumes today's Daily Run, 409 once played): the run's id, the anchor, the first card as an image only (409 for `pro` while Pro is gated) |
| `POST /api/runs/:id/place`         | `{ position, slot }`: the verdict; the card's name and year only on a miss                                                                                                                             |
| `POST /api/runs/:id/bonus`         | `{ position, yearGuess, nameGuess }` (nulls to skip): the answer and the round's score; late counts as skipped                                                                                         |
| `POST /api/runs/:id/next`          | `{ position, name }`: the next card, or the end — the server writes the score (with the name, if it passes the rules) and answers the device's rank                                                    |
| `POST /api/runs/:id/name`          | `{ name }`: names a finished run's score while it is still "Anonymous" (409 once named, 400 for a refused name)                                                                                        |
| `POST /api/share`                  | `{ kind: daily\|endless, method: sheet\|copy\|download }`: today's anonymous share count + 1 (204; 400 for anything else). No device, no run                                                           |
| `GET /api/scores`                  | The global board, each device's best: `?difficulty=normal\|pro&period=all\|week&page=N&device=<id>` → rows, players, pages, `me`. There is no POST                                                     |
| `GET /api/admin/games?difficulty=` | Live games of one tier with name, year and primary shot (admin session only, since Sprint 10b)                                                                                                         |
| `GET /api/admin/rawg?q=…`          | RAWG screenshot search (admin session only)                                                                                                                                                            |
| `GET /api/admin/rawg/image?url=…`  | Same-origin proxy for a rawg.io image (admin session only)                                                                                                                                             |

Pages besides the game: `/impressum` (legal notice, Austrian law) and `/privacy` (privacy
policy), both EN/DE and linked from the footer; `/admin` (the admin panel); `/styleguide`
(noindex, linked nowhere).

**Pro is gated.** It is offered — and `pro` is served and stored — only once 100 games are live
in Pro (`PRO_MIN_POOL`, `src/lib/modes.ts`); below that the welcome screen shows it as "Coming
soon". The gate opens by itself. `PRO_MIN_POOL_OVERRIDE` lowers it for staging and local testing
and is ignored on production.

## Admin Panel

`/admin` — log in with `ADMIN_PASSWORD`, then add, edit, delete and bulk-import games, upload
screenshots to Vercel Blob or pull them from RAWG, into a game's Normal or Pro slot.

**A new game is a draft by default.** A game is live in a tier only when it is **published and has
a primary screenshot of that tier** (Normal or Pro; Pro is offered once 100 games are live in it); a draft never appears in a round however complete it looks. Publish it from the
game's own page once it has been reviewed. Drafts carry an amber `DRAFT` badge and a
`?status=draft` filter — deliberately unlike the red `NO SCREENSHOT` flag and its `?missing=both`,
because one is a choice and the other is a gap.

Every screenshot takes the same path — into the browser, cropped to 16:9 in the crop step,
re-encoded to WebP at most 1600×900, then uploaded — whether it came from the file picker or from
RAWG. A RAWG candidate opens full size in the lightbox first, so it can be looked at before it is
chosen; "Use this screenshot" switches that lightbox to the crop view. An untouched crop is the
largest centred 16:9 area, the tool will not zoom in past 640×360 source pixels, and the chosen
rectangle is stored in `crop_*`. "Crop again" on an existing shot replaces it or adds a new
Normal/Pro shot from it — from the RAWG original when there is one, from the stored image otherwise.

The RAWG picker sits on the create form as well as the edit page, so a game can be added with its
screenshot in one pass. On the create form the chosen image is held in the browser until the game
exists and is then uploaded with it; the file picker and the RAWG picker feed the same field, so
using one clears the other.

The game list searches as you type (3 characters, 300 ms debounce), a row click opens the game,
and the detail page steps through the list with prev/next.

| Variable         | Needed for                                         |
| ---------------- | -------------------------------------------------- |
| `ADMIN_PASSWORD` | Logging in at all — without it the panel is closed |
| `RAWG_API_KEY`   | Optional: the "Import from RAWG" picker            |

The password is also the session signing key, so changing it signs everyone out.

## Docs

| Where                | What                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `PLAN.md`            | What is being worked on now, and what comes next                                               |
| `ROADMAP.md`         | Product vision and the order of the milestones                                                 |
| `CHANGELOG.md`       | One line per production release                                                                |
| `docs/architecture/` | How it works: file tree, game rules, code flow, frontend, admin panel                          |
| `docs/runbooks/`     | How to operate it: environments, releases, schema migrations, adding games                     |
| `docs/decisions.md`  | Why it is the way it is                                                                        |
| `docs/history/`      | Every finished milestone in full                                                               |
| `CLAUDE.md`          | The short brief every Claude Code session starts with; `.claude/rules/` holds the coding rules |
