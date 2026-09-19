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

Without credentials the app still runs: the API routes return 503 and the client falls back to the
bundled `src/lib/data/games.json` with screenshots served from `static/screenshots/`.

## Commands

| Command                             | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `npm run dev`                       | Dev server                                         |
| `npm run build` / `npm run preview` | Production build and local preview                 |
| `npm run lint` / `npm run check`    | ESLint / svelte-check                              |
| `npm run format`                    | Prettier                                           |
| `npm run game:add "Name" 2023`      | Add a game to `games.json`                         |
| `npm run game:list`                 | List games by year                                 |
| `npm run db:seed`                   | Seed the database from `games.json`                |
| `npm run db:studio`                 | Browse the database                                |
| `npm run blob:migrate`              | Upload screenshots to Vercel Blob, rewrite DB URLs |

Run `lint`, `check` and `build` before committing — see `.claude/rules/quality-checks.md`.

## API

| Route                            | Purpose                                 |
| -------------------------------- | --------------------------------------- |
| `GET /api/games`                 | All games with their primary screenshot |
| `GET /api/games/random?count=14` | Random set for one round                |
| `GET /api/scores?limit=20`       | Global leaderboard                      |
| `POST /api/scores`               | Submit a score                          |

## Docs

`CLAUDE.md` for project context, `SPRINTS.md` for the roadmap, `.claude/docs/` for architecture
notes and `.claude/rules/` for the coding conventions.
