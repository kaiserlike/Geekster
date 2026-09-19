# `games.json` — seed data, not the live catalogue

`games.json` is **test and seed data**. It is not loaded at runtime and it is not what
players see.

The Turso database is the single source of truth for games and screenshots. A SvelteKit API
route runs as a Vercel serverless function with a read-only filesystem, so anything created in
the admin panel can never be written back into this file — which is why the file was demoted.

| Where                   | Reads `games.json`                                                              |
| ----------------------- | ------------------------------------------------------------------------------- |
| The game (browser)      | no — it fetches `/api/games/random`, and shows an error if that fails           |
| `npm run db:seed`       | yes — upserts these entries by slug into an empty or explicitly forced database |
| `npm run game:add/list` | yes — the CLI edits this file                                                   |
| The screenshot scripts  | yes — `fetch-screenshots`, `convert-screenshots`, `generate-placeholders`       |

Adding a game here does **not** put it into the live game. It reaches players only once it has
been seeded into the database or created in the admin panel at <https://geekster.pro/admin>.

See `.claude/docs/adding-games.md` for the full path a game takes.
