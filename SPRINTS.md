# Geekster - Sprint Plan

A timeline guessing game for video game screenshots. Similar to Hitster, but instead of songs, players place video game screenshots in chronological order.

## Tech Stack

- **Frontend/Backend:** SvelteKit (TypeScript)
- **Styling:** Tailwind CSS
- **Database:** SQLite (JSON file for Sprint 1, migrate to SQLite in Sprint 2)
- **Hosting:** Vercel / Cloudflare Pages (free tier)

---

## Sprint 1 - Foundation & Core Game Loop (MVP)

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

## Sprint 2 - Game Database & Polish

> Goal: Enough content for replayability, better UX

### User Stories

- [ ] US-2.1: As a player, I get a different set of games each round (randomized from larger pool)
- [ ] US-2.2: As a player, I see smooth animations when placing a game in the timeline
- [ ] US-2.3: As a player, I see the game name + year revealed after placing it
- [ ] US-2.4: As a player, I can restart the game after winning or losing
- [ ] US-2.5: As a maintainer, I can easily add new games to the database

### Tech Tasks

- Migrate from JSON to SQLite database
- Admin seed script for bulk-importing games
- Add 50+ games to the database
- Improve UI/UX (animations, transitions, mobile-optimized)

---

## Sprint 3 - Difficulty & Game Modes

> Goal: More engaging gameplay

### User Stories

- [ ] US-3.1: As a player, I can choose a difficulty (easy = decades apart, hard = close years)
- [ ] US-3.2: As a player, I have limited wrong guesses (e.g., 3 lives)
- [ ] US-3.3: As a player, I see my current score/streak
- [ ] US-3.4: As a player, I can share my result (e.g., "I got 10/10 on Geekster!")

### Tech Tasks

- Difficulty selection logic (filter games by year spread)
- Lives/health system
- Score tracking
- Share result (copy to clipboard, social preview)

---

## Sprint 4 - Bonus Points & Knowledge

> Goal: Reward deeper gaming knowledge

### User Stories

- [ ] US-4.1: As a player, I can optionally guess the exact release year for bonus points
- [ ] US-4.2: As a player, I can optionally guess the game's name for bonus points
- [ ] US-4.3: As a player, I see a final score that reflects both ordering + bonus points
- [ ] US-4.4: As a player, I see a leaderboard of my own past scores (local storage)

### Tech Tasks

- Bonus point input UI (year guess, name guess)
- Scoring algorithm (proximity-based for year, fuzzy match for name)
- Local storage leaderboard

---

## Sprint 5 - Multiplayer & Social

> Goal: Play with friends

### User Stories

- [ ] US-5.1: As a player, I can create a game room and share a link
- [ ] US-5.2: As players, we take turns placing games on a shared timeline
- [ ] US-5.3: As a player, I see other players' scores in real-time

### Tech Tasks

- WebSocket or server-sent events for real-time
- Room/session management
- Turn-based game logic
- Multiplayer UI
