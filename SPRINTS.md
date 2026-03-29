# Geekster - Sprint Plan

A timeline guessing game for video game screenshots. Similar to Hitster, but instead of songs, players place video game screenshots in chronological order.

## Tech Stack

- **Frontend/Backend:** SvelteKit (TypeScript)
- **Styling:** Tailwind CSS
- **Database:** JSON file (SQLite deferred to Sprint 4)
- **Hosting:** Vercel / Cloudflare Pages (free tier)

---

## Sprint 1 - Foundation & Core Game Loop (MVP) ✅

> Goal: A playable single-player game with hardcoded data

### User Stories

- [x] US-1.1: As a player, I see a welcome screen with a "Start Game" button
- [x] US-1.2: As a player, I see a first screenshot with its release year as the anchor on a timeline
- [x] US-1.3: As a player, I see a new screenshot and must place it before or after the existing one(s)
- [x] US-1.4: As a player, I get visual feedback whether my placement was correct or wrong
- [x] US-1.5: As a player, I win when I have 10 games correctly placed in the timeline
- [x] US-1.6: As a player, I see a game-over/win screen with the final timeline

### Tech Tasks

- Project setup (SvelteKit + Tailwind CSS + TypeScript)
- Game data as JSON (15-20 games with name, year, screenshot placeholder)
- Core game state logic (timeline, placement validation, win condition)
- Basic responsive UI

---

## Sprint 2 - Game Database & Polish ✅

> Goal: Enough content for replayability, better UX

### User Stories

- [x] US-2.1: As a player, I get a different set of games each round (randomized from 55-game pool)
- [x] US-2.2: As a player, I see smooth animations when placing a game in the timeline
- [x] US-2.3: As a player, I see the game name + year revealed after placing it
- [x] US-2.4: As a player, I can restart the game after winning or losing
- [x] US-2.5: As a maintainer, I can easily add new games to the database

### Tech Tasks

- ~~Migrate from JSON to SQLite database~~ (deferred to Sprint 4)
- CLI tool for adding games (`npm run game:add`)
- Expanded to 55 games in JSON database
- Animations: fly transitions, fade transitions, slide reveal
- Reveal flow: name + year shown for ~2s after placement
- "Play Again" (restart) and "Main Menu" buttons on result screen
- Sticky current card + larger touch targets on mobile

---

## Sprint 3 - Lives, Streak & Drag-and-Drop ✅

> Goal: More engaging gameplay with tactile interactions

### User Stories

- [x] US-3.1: As a player, I can drag and drop the current game card into the available timeline slots
- [x] US-3.2: As a player, I have limited wrong guesses (3 lives)
- [x] US-3.3: As a player, I see my current score and streak
- [x] US-3.4: As a player, during drag the existing timeline games get minified (year + title only) to minimize scrolling

### Tech Tasks

- Drag and drop: HTML5 DnD for desktop + custom touch drag (long-press) for mobile
- Timeline card minification during drag (compact name + year bars)
- Lives/health system (3 lives, game over at 0)
- Streak tracking (consecutive correct placements)
- Updated header UI: lives indicators + streak counter
- Auto-scroll during touch drag near viewport edges
- Updated welcome screen instructions

---

## Sprint 4 - Bonus Points & Knowledge ✅

> Goal: Reward deeper gaming knowledge

### User Stories

- [x] US-4.1: As a player, I can optionally guess the exact release year for bonus points
- [x] US-4.2: As a player, I can optionally guess the game's name for bonus points
- [x] US-4.3: As a player, I see a final score that reflects both ordering + bonus points
- [x] US-4.4: As a player, I see a leaderboard of my own past scores (local storage)

### Tech Tasks

- Bonus point input UI (year guess, name guess)
- Scoring algorithm (proximity-based for year, fuzzy match for name)
- Local storage leaderboard

---

## Sprint 5 - Real Screenshots & UI Polish ✅

> Goal: Production-quality visuals

### Tech Tasks

- [x] Replaced SVG placeholders with real game screenshots
- [x] Screenshot audit: replaced images showing game titles/logos with clean gameplay shots
- [x] i18n support with language switcher
- [x] GitHub Pages deployment

---

## Sprint 6 - Backend Foundation & Database

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
| **Image storage** | **Cloudflare R2** or **Vercel Blob**                 | Free tier, no git bloat, CDN-backed                                                                                           |
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

- [ ] US-6.1: As a developer, the game loads data from an API instead of a static JSON file
- [ ] US-6.2: As a developer, game data is stored in a SQLite database (Turso)
- [ ] US-6.3: As a developer, screenshots are served from blob storage instead of the git repo
- [ ] US-6.4: As a developer, I can deploy the app to Vercel with SSR support
- [ ] US-6.5: As a player, the game works exactly as before (no visible changes)

### Tech Tasks

#### 6a — Database Setup

- [ ] Install Drizzle ORM + Turso client (`@libsql/client`, `drizzle-orm`, `drizzle-kit`)
- [ ] Define schema in `src/lib/server/schema.ts`
- [ ] Configure Drizzle for Turso connection (`drizzle.config.ts`)
- [ ] Create and run initial migration
- [ ] Write seed script: import all 125 games from `games.json` into the database

#### 6b — API Routes

- [ ] `GET /api/games` — list all games (used by game logic)
- [ ] `GET /api/games/random?count=10&difficulty=medium` — get random game set for a round
- [ ] `POST /api/scores` — submit a score to the global leaderboard
- [ ] `GET /api/scores?limit=20` — fetch top scores

#### 6c — Screenshot Migration

- [ ] Set up Cloudflare R2 bucket (or Vercel Blob)
- [ ] Write migration script: upload all `static/screenshots/*.webp` to blob storage
- [ ] Update database `screenshots` table with blob URLs
- [ ] Update frontend to load images from blob URLs

#### 6d — Frontend Migration

- [ ] Replace `games.json` import with `fetch('/api/games/random')` in game state
- [ ] Update score submission to `POST /api/scores`
- [ ] Keep local storage leaderboard as fallback, add global leaderboard tab
- [ ] Ensure all existing features work identically

#### 6e — Deployment

- [ ] Add Vercel adapter (`@sveltejs/adapter-vercel`)
- [ ] Configure environment variables (Turso URL, Turso auth token, R2 credentials)
- [ ] Deploy to Vercel
- [ ] Verify production build

---

## Sprint 7 - Admin Panel

> Goal: Web-based admin interface for managing games and screenshots

### User Stories

- [ ] US-7.1: As an admin, I can log in to a protected admin area
- [ ] US-7.2: As an admin, I can view all games in a sortable/filterable table
- [ ] US-7.3: As an admin, I can add a new game (name, year) and upload screenshots
- [ ] US-7.4: As an admin, I can edit a game's details and manage its screenshots
- [ ] US-7.5: As an admin, I can delete a game
- [ ] US-7.6: As an admin, I can assign difficulty levels to individual screenshots
- [ ] US-7.7: As an admin, I can fetch screenshot candidates from RAWG API and pick the best one

### Tech Tasks

#### 7a — Auth & Layout

- [ ] Admin auth middleware (check password/token from env var)
- [ ] Admin layout with sidebar navigation (`/admin`)
- [ ] Protected route group (`src/routes/admin/`)

#### 7b — Game Management

- [ ] `/admin/games` — game list with search, sort by name/year
- [ ] `/admin/games/new` — add game form with screenshot upload
- [ ] `/admin/games/[id]` — edit game, manage screenshots
- [ ] Delete game with confirmation
- [ ] Bulk import from CSV/JSON

#### 7c — Screenshot Management

- [ ] Upload screenshots directly to blob storage from admin
- [ ] RAWG integration: search game, preview screenshots, one-click import
- [ ] Set difficulty per screenshot (easy/medium/hard)
- [ ] Set primary screenshot flag
- [ ] Image preview and crop/resize on upload

#### 7d — Dashboard

- [ ] `/admin` — overview: total games, total scores, recent activity
- [ ] Quick-add game form on dashboard

---

## Sprint 8 - Difficulty System

> Goal: Players can choose difficulty, which affects which screenshots are shown

### User Stories

- [ ] US-8.1: As a player, I can choose difficulty (Easy / Medium / Hard) on the welcome screen
- [ ] US-8.2: As a player, Easy mode shows the most recognizable screenshots
- [ ] US-8.3: As a player, Hard mode shows obscure or cropped screenshots
- [ ] US-8.4: As a player, my score reflects the difficulty I played on

### Tech Tasks

- [ ] Difficulty selector on welcome screen
- [ ] API: filter screenshots by difficulty when creating a game round
- [ ] Score multiplier based on difficulty (1x / 1.5x / 2x)
- [ ] Leaderboard filtered by difficulty

---

## Sprint 9 - Global Leaderboard

> Goal: Compete with other players worldwide

### User Stories

- [ ] US-9.1: As a player, I see a global leaderboard with top scores
- [ ] US-9.2: As a player, I can enter my name when submitting a score
- [ ] US-9.3: As a player, I can filter the leaderboard by difficulty and time period
- [ ] US-9.4: As a player, I see my rank after completing a game

### Tech Tasks

- [ ] Leaderboard page (`/leaderboard`)
- [ ] Score submission flow (name input after game)
- [ ] Leaderboard API with pagination, filtering, time ranges
- [ ] Anti-cheat: basic server-side score validation
- [ ] Personal best tracking

---

## Sprint 10 - Multiplayer

> Goal: Play with friends in real-time

### User Stories

- [ ] US-10.1: As a player, I can create a multiplayer room and get a share code/link
- [ ] US-10.2: As a player, I can join a room with a code
- [ ] US-10.3: As players, we take turns placing games on a shared timeline
- [ ] US-10.4: As a player, I see other players' scores and turns in real-time
- [ ] US-10.5: As a player, I see a final results screen comparing all players

### Architecture

| Component              | Choice                                         | Rationale                                             |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| **Real-time**          | **PartyKit** or **Cloudflare Durable Objects** | Managed WebSocket infrastructure, free tier available |
| **Session management** | Server-side room state                         | Prevents cheating, single source of truth             |

### Tech Tasks

#### 10a — Infrastructure

- [ ] Set up PartyKit (or Durable Objects)
- [ ] Room creation and join logic
- [ ] WebSocket connection management

#### 10b — Game Logic

- [ ] Server-side turn management
- [ ] Shared game state synchronization
- [ ] Timer per turn (optional)
- [ ] Score calculation per player

#### 10c — UI

- [ ] Room creation / join screen
- [ ] Player list sidebar
- [ ] Turn indicator
- [ ] Real-time score updates
- [ ] Multiplayer results screen
