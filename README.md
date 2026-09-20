# Geekster

A timeline guessing game for video game screenshots. You get a screenshot and have to place it
chronologically against the games already on your timeline — like the card game Hitster, but with
video games instead of songs.

Live at **<https://geekster.pro>**.

## Stack

- **SvelteKit** (Svelte 5 runes) + TypeScript, **Tailwind CSS v4**
- **bits-ui** for the admin panel's dialogs (confirm + screenshot lightbox)
- **Turso** (libSQL/SQLite) via **Drizzle ORM** — games, screenshots, scores
- **Vercel Blob** for the screenshot images
- Hosted on **Vercel** (SSR + API routes)

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

| Command                             | Purpose                                                                |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`                       | Dev server                                                             |
| `npm run build` / `npm run preview` | Production build and local preview                                     |
| `npm run lint` / `npm run check`    | ESLint / svelte-check                                                  |
| `npm run format`                    | Prettier                                                               |
| `npm run game:add "Name" 2023`      | Add a game to `games.json`                                             |
| `npm run game:list`                 | List games by year                                                     |
| `npm run db:generate`               | Generate a migration in `drizzle/` from the Drizzle schema             |
| `npm run db:migrate`                | Apply pending migrations locally (`file:local.db`)                     |
| `npm run db:migrate:staging`        | Apply them to staging                                                  |
| `npm run db:migrate:production`     | Apply them to production                                               |
| `npm run db:seed`                   | Upsert `games.json` into the database by slug (`--force`, `--dry-run`) |
| `npm run db:studio`                 | Browse the database                                                    |
| `npm run blob:migrate`              | Upload screenshots to Vercel Blob, rewrite DB URLs                     |

Run `lint`, `check` and `build` before committing — see `.claude/rules/quality-checks.md`.
CI runs the same commands plus `format:check` on every pull request.

## Schema changes

`drizzle/` holds the migration history and is the only thing that creates or alters a table.
`db:push` is deliberately not available — it changes a database without leaving a record, which
is how the three databases drifted apart before Sprint 7h.

1. Edit `src/lib/server/schema.ts`
2. `npm run db:generate` — review the generated `.sql` like code and commit it with the change
3. `npm run db:migrate:staging` when the branch reaches `develop`
4. `npm run db:migrate:production` at release, in that order

Each stage is named, so nothing has to be uncommented in `.env` and nothing has to be put back
afterwards. `TURSO_DATABASE_URL` — what the application reads — stays at `file:local.db`, which is
what stops the local admin panel from reaching production while a migration is applied to it.

Migrations are run from a laptop, never from CI: CI would need production credentials in GitHub
secrets, and a migration that fails halfway through a deploy has no rollback.

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
production and staging: **`.claude/docs/schema-migrations.md`**.

## Deployment

| Branch    | Builds     | URL                            |
| --------- | ---------- | ------------------------------ |
| `main`    | Production | <https://geekster.pro>         |
| `develop` | Staging    | <https://staging.geekster.pro> |
| other     | Preview    | generated `*.vercel.app` URL   |

Vercel's Git integration does the deploying — there is no deploy workflow and no `VERCEL_TOKEN`
in GitHub. `.github/workflows/ci.yml` only gates: lint, format, svelte-check and build. `main`
requires a passing PR, so the flow is `feature/*` → `develop` → `main`.

Staging and preview share one Vercel Preview environment (Custom Environments are a Pro feature),
so they read the same staging database. Both sit behind Vercel Authentication — the protection
exemption for custom domains applies to the production domain only — so `staging.geekster.pro`
needs a Vercel login. Screenshots uploaded outside production land under a
`staging/` prefix in the same blob store, which keeps them from overwriting production images.

## API

| Route                            | Purpose                                     |
| -------------------------------- | ------------------------------------------- |
| `GET /api/games`                 | All games with their primary screenshot     |
| `GET /api/games/random?count=14` | Random set for one round                    |
| `GET /api/scores?limit=20`       | Global leaderboard                          |
| `POST /api/scores`               | Submit a score                              |
| `GET /api/admin/rawg?q=…`        | RAWG screenshot search (admin session only) |

## Admin Panel

`/admin` — log in with `ADMIN_PASSWORD`, then add, edit, delete and bulk-import games, upload
screenshots to Vercel Blob or pull them from RAWG, and set each screenshot's difficulty.

The game list searches as you type (3 characters, 300 ms debounce), a row click opens the game,
and the detail page steps through the list with prev/next. A game with no screenshot is flagged
red and filtered with `?missing=1` — it is hidden from the game itself, because both game APIs
inner-join the primary screenshot.

| Variable         | Needed for                                         |
| ---------------- | -------------------------------------------------- |
| `ADMIN_PASSWORD` | Logging in at all — without it the panel is closed |
| `RAWG_API_KEY`   | Optional: the "Import from RAWG" picker            |

The password is also the session signing key, so changing it signs everyone out.

## Docs

`CLAUDE.md` for project context, `SPRINTS.md` for the roadmap, `.claude/docs/` for architecture
notes and `.claude/rules/` for the coding conventions.
