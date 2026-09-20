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
`file:local.db` and run `npm run db:seed`, which loads the 125 games from
`src/lib/data/games.json` with screenshots served from `static/screenshots/`.

## Commands

| Command                             | Purpose                                                                |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`                       | Dev server                                                             |
| `npm run build` / `npm run preview` | Production build and local preview                                     |
| `npm run lint` / `npm run check`    | ESLint / svelte-check                                                  |
| `npm run format`                    | Prettier                                                               |
| `npm run game:add "Name" 2023`      | Add a game to `games.json`                                             |
| `npm run game:list`                 | List games by year                                                     |
| `npm run db:seed`                   | Upsert `games.json` into the database by slug (`--force`, `--dry-run`) |
| `npm run db:studio`                 | Browse the database                                                    |
| `npm run blob:migrate`              | Upload screenshots to Vercel Blob, rewrite DB URLs                     |

Run `lint`, `check` and `build` before committing — see `.claude/rules/quality-checks.md`.
CI runs the same commands plus `format:check` on every pull request.

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
