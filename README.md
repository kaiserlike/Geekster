# Geekster

A timeline guessing game for video game screenshots. You get a screenshot and have to place it
chronologically against the games already on your timeline — like the card game Hitster, but with
video games instead of songs.

Live at **<https://geekster.pro>**.

## Stack

- **SvelteKit** (Svelte 5 runes) + TypeScript, **Tailwind CSS v4**
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

| Variable         | Needed for                                         |
| ---------------- | -------------------------------------------------- |
| `ADMIN_PASSWORD` | Logging in at all — without it the panel is closed |
| `RAWG_API_KEY`   | Optional: the "Import from RAWG" picker            |

The password is also the session signing key, so changing it signs everyone out.

## Docs

`CLAUDE.md` for project context, `SPRINTS.md` for the roadmap, `.claude/docs/` for architecture
notes and `.claude/rules/` for the coding conventions.
