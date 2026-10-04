<!-- Archived verbatim from SPRINTS.md on 2026-10-04. It describes the project as it was then;
     CLAUDE.md and docs/ describe the present. See docs/history/README.md for the naming. -->

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
