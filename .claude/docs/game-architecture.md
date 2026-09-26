# Game Architecture

## State Machine

The game uses a phase-based state machine defined in `src/lib/game.svelte.ts`:

```
Welcome → Playing → Result
```

### Phases

- **welcome**: Start screen with rules and language selector
- **playing**: Active gameplay — placing games on the timeline
- **result**: The run is over — `endReason` is `outOfLives` or `poolCleared` (perfect run when
  there were no wrong placements). Shows score, stats and leaderboard. There is no win in solo

## Core Game Loop (Playing Phase)

1. An anchor game is placed on the timeline with its year visible
2. A new game card appears (screenshot only, no year/name)
3. Player places the card in the timeline (click slot or drag-and-drop)
4. `placeGame(slotIndex)` checks placement correctness:
   - **Correct**: Game inserted at chosen position, streak increments; at every streak multiple of
     10 a life comes back if below 3 (`livesWonBack`, `lifeRegained` drives the heart animation)
   - **Wrong**: Game auto-inserted at correct position, life lost, streak resets
5. If placement was correct → bonus guess panel appears (guess year + name)
6. Score is calculated: base (100 for correct) + year bonus + name bonus, multiplied by streak
7. 2-second reveal phase shows the game's name and year
8. `advanceToNextGame()` loads the next card
9. `runOutcome(lives, remaining)` ends the run at 0 lives or an empty pool — never at a number of
   placements. Solo is endless (Sprint 8)

## Placement Logic (src/lib/placement.ts)

Pure functions, unit-tested in `placement.test.ts`; `game.svelte.ts` only applies their results.

- `isPlacementCorrect(timeline, year, slotIndex)`: year >= left neighbour's (if any) and <= right
  neighbour's (if any). Identical years are always correct, on either side (by design)
- `findCorrectIndex(timeline, year)`: where a wrong placement is auto-inserted — before the first
  game of the same year or later
- `regainsLife(streak, lives, maxLives)`: true at every multiple of `LIFE_REGAIN_STREAK` (10) while
  a life is missing
- `runOutcome(lives, remainingGames)`: `outOfLives` at 0 lives (even if the pool ran out on the
  same card), `poolCleared` when the pool is empty, otherwise `null`
- `isPerfectRun(endReason, wrongPlacements)`: a cleared pool with no wrong placement

## Scoring System (src/lib/scoring.ts, tested in scoring.test.ts)

- **Base**: 100 points for correct placement, 0 for wrong
- **Year bonus**: 50 - |guess - actual| \* 10 (max 50, min 0)
- **Name bonus**: 50 for exact match, 35 for Dice coefficient >= 0.8, 20 for partial matches
- **Streak multiplier**: 1.0 at streak 1, +0.1 per additional streak, capped at 1.5x

## Drag-and-Drop

Past `COMPACT_TIMELINE_AT` (12) cards the timeline renders one line per game (the card just placed
stays full-size), and every card collapses to a line while a drag is in progress.

Two implementations coexist:

- **Desktop**: HTML5 Drag and Drop API (`draggable`, `ondragstart`, `ondragover`, `ondrop`)
- **Mobile**: Custom touch implementation with 250ms long-press activation, floating card clone, auto-scroll near edges

## Data Flow

```
GET /api/games/random?count=1000  →  anchor (1) + the rest of the shuffled live pool
   (on error: no round starts — the player sees the error and can retry)
                                           ↓
                                    timeline (grows) ← placeGame()
                                           ↓
                                    scoring → leaderboard (localStorage `geekster-leaderboard-normal`;
                                              old 10-game `geekster-leaderboard` read-only "Classic")
```

## Key Functions (game.svelte.ts)

- `startGame()`: Initialize new game with shuffled selection
- `placeGame(slotIndex)`: Place current game, check correctness, update state
- `advanceToNextGame()`: Move to next card after reveal, or end the run via `runOutcome()`
- `restartGame()`: Start new game without going to welcome screen
- `resetGame()`: Return to welcome screen
- `submitBonusGuess(guess)`: Submit year/name guess for bonus points
- `skipBonusGuess()`: Skip bonus guess round

## i18n (src/lib/i18n.svelte.ts)

- Two languages: English (en) and German (de)
- Locale stored in reactive state with `$state`
- `t(key)` function returns translated string
- `getLocale()` / `setLocale()` for language switching
- Components use `LangSwitch.svelte` for the toggle UI

## Admin Panel (Sprint 7)

```
/admin/login  --(password → HMAC cookie)-->  /admin/**        guarded by src/hooks.server.ts
                                             /api/admin/**    401 without a session
```

- `src/lib/server/auth.ts` — `ADMIN_PASSWORD` is both the credential and the HMAC key of the
  `<expiry>.<signature>` session cookie (12 hours). No session table, no rate limiting
- `src/lib/server/games.ts` — every read and write the panel performs; `slugify()`/`uniqueSlug()`
  own the slug, which also names the file in the blob store
- `src/lib/server/blob.ts` — `screenshots/<slug>.webp` for the first screenshot of a game,
  `-2`, `-3`, … for the rest. Deleting a row deletes the blob unless the URL is a local path
- `src/lib/server/rawg.ts` — search is proxied through `/api/admin/rawg`; only `rawg.io` images
  may be downloaded
- Exactly one screenshot per game is primary. A game without a primary screenshot never reaches
  `/api/games/random`, and the dashboard counts those explicitly
