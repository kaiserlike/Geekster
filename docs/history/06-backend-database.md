<!-- Archived verbatim from SPRINTS.md on 2026-10-04. It describes the project as it was then;
     CLAUDE.md and docs/ describe the present. See docs/history/README.md for the naming. -->

## Sprint 6 - Backend Foundation & Database ✅

> Goal: Migrate from static JSON to a real backend with database, enabling future admin panel, multiplayer, and global leaderboard

### Why Now

The static JSON + GitHub Pages approach works for the current game, but cannot support:

- Admin panel for managing games/screenshots without git
- Multiple screenshots per game (difficulty levels)
- Global leaderboard (requires server-side persistence)
- Multiplayer (requires real-time server)

### Architecture Decisions

| Component         | Choice                                               | Rationale                                                                                                                     |
| ----------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Backend**       | SvelteKit API routes (`+server.ts`)                  | Already using SvelteKit; no separate server needed                                                                            |
| **Database**      | SQLite via **Turso** (libSQL)                        | Free tier (500 DBs, 9 GB, 500M reads/mo). Relational data model fits game/screenshot/score relationships. No server to manage |
| **ORM**           | **Drizzle**                                          | Type-safe, lightweight, excellent SQLite/Turso support                                                                        |
| **Image storage** | **Vercel Blob**                                      | Free tier, no git bloat, CDN-backed. Chosen over R2: same platform, one env var, no S3 SDK                                    |
| **Hosting**       | **Vercel** (move from GitHub Pages)                  | Free tier supports SSR + API routes. GitHub Pages is static-only                                                              |
| **Auth (admin)**  | Simple password via env var (upgrade to OAuth later) | Minimal setup for single-admin use case                                                                                       |

### Database Schema

```sql
-- Core game data
games (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  year        INTEGER NOT NULL,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
)

-- Multiple screenshots per game, with difficulty
screenshots (
  id          INTEGER PRIMARY KEY,
  game_id     INTEGER REFERENCES games(id),
  url         TEXT NOT NULL,          -- R2/blob URL
  difficulty  TEXT DEFAULT 'medium',  -- easy | medium | hard
  is_primary  INTEGER DEFAULT 0,     -- shown by default
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
)

-- Global leaderboard
scores (
  id                INTEGER PRIMARY KEY,
  player_name       TEXT NOT NULL,
  total_score       INTEGER NOT NULL,
  correct_placements INTEGER,
  wrong_placements  INTEGER,
  best_streak       INTEGER,
  difficulty        TEXT DEFAULT 'medium',
  created_at        TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### User Stories

- [x] US-6.1: As a developer, the game loads data from an API instead of a static JSON file
- [x] US-6.2: As a developer, game data is stored in a SQLite database (Turso)
- [x] US-6.3: As a developer, screenshots are served from blob storage instead of the git repo
- [x] US-6.4: As a developer, I can deploy the app to Vercel with SSR support
- [x] US-6.5: As a player, the game works exactly as before (no visible changes)

### Tech Tasks

#### 6a — Database Setup

- [x] Install Drizzle ORM + Turso client (`@libsql/client`, `drizzle-orm`, `drizzle-kit`)
- [x] Define schema in `src/lib/server/schema.ts`
- [x] Configure Drizzle for Turso connection (`drizzle.config.ts`)
- [x] Create and run initial migration
- [x] Write seed script: import all 125 games from `games.json` into the database

#### 6b — API Routes

- [x] `GET /api/games` — list all games (used by game logic)
- [x] `GET /api/games/random?count=10&difficulty=medium` — get random game set for a round
- [x] `POST /api/scores` — submit a score to the global leaderboard
- [x] `GET /api/scores?limit=20` — fetch top scores

#### 6c — Screenshot Migration

Provider decision: **Vercel Blob** over Cloudflare R2 — already on Vercel, one package
(`@vercel/blob`) and one env var, and 5 MB of screenshots is far inside the free tier.

- [x] Choose provider and install the client (`@vercel/blob`)
- [x] Write migration script: `npm run blob:migrate` — uploads `static/screenshots/*.webp`,
      then rewrites `screenshots.url` in the database (`--dry-run` / `--force` supported)
- [x] Update frontend to handle absolute blob URLs (`resolveScreenshotUrl()` in `src/lib/imageUrl.ts`)
- [x] Create the Blob store and set `BLOB_READ_WRITE_TOKEN` — store `geekster-screenshots`
      (`store_INcAJWeUsvrWGj0t`, region fra1, **access: public**). Note: a store's access mode is
      fixed at creation; a private store cannot serve images to `<img src>`
- [x] Run `npm run blob:migrate` against the production database — 125/125 uploaded,
      all `screenshots.url` rows now absolute, served with `cache-control: max-age=31536000`

#### 6d — Frontend Migration

- [x] Replace `games.json` import with `fetch('/api/games/random')` in game state
- [x] Update score submission to `POST /api/scores`
- [x] Keep local storage leaderboard as fallback, add global leaderboard tab
- [x] Ensure all existing features work identically

#### 6e — Deployment

- [x] Add Vercel adapter (`@sveltejs/adapter-vercel`)
- [x] Configure environment variables (Turso URL, Turso auth token, R2 credentials)
- [x] Deploy to Vercel
- [x] Verify production build
