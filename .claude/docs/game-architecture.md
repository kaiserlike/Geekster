# Game Architecture

## State Machine

The game uses a phase-based state machine defined in `src/lib/game.svelte.ts`:

```
Welcome → Playing → Result
```

### Phases

- **welcome**: Start screen with rules and language selector
- **playing**: Active gameplay — placing games on the timeline
- **result**: Game over (win or lose) — shows final score and leaderboard

## Core Game Loop (Playing Phase)

1. An anchor game is placed on the timeline with its year visible
2. A new game card appears (screenshot only, no year/name)
3. Player places the card in the timeline (click slot or drag-and-drop)
4. `placeGame(slotIndex)` checks placement correctness:
   - **Correct**: Game inserted at chosen position, streak increments
   - **Wrong**: Game auto-inserted at correct position, life lost, streak resets
5. If placement was correct → bonus guess panel appears (guess year + name)
6. Score is calculated: base (100 for correct) + year bonus + name bonus, multiplied by streak
7. 2-second reveal phase shows the game's name and year
8. `advanceToNextGame()` loads the next card
9. Win at 10 correct placements, lose at 0 lives

## Placement Logic

`isPlacementCorrect(game, slotIndex)` checks:

- Game's year >= left neighbor's year (if exists)
- Game's year <= right neighbor's year (if exists)
- Games with identical years are always considered correct (by design)

## Scoring System (src/lib/scoring.ts)

- **Base**: 100 points for correct placement, 0 for wrong
- **Year bonus**: 50 - |guess - actual| \* 10 (max 50, min 0)
- **Name bonus**: 50 for exact match, 35 for Dice coefficient >= 0.8, 20 for partial matches
- **Streak multiplier**: 1.0 at streak 1, +0.1 per additional streak, capped at 1.5x

## Drag-and-Drop

Two implementations coexist:

- **Desktop**: HTML5 Drag and Drop API (`draggable`, `ondragstart`, `ondragover`, `ondrop`)
- **Mobile**: Custom touch implementation with 250ms long-press activation, floating card clone, auto-scroll near edges

## Data Flow

```
games.json → shuffle → select 14 games → anchor (1) + remaining (13)
                                           ↓
                                    timeline (grows) ← placeGame()
                                           ↓
                                    scoring → leaderboard (localStorage)
```

## Key Functions (game.svelte.ts)

- `startGame()`: Initialize new game with shuffled selection
- `placeGame(slotIndex)`: Place current game, check correctness, update state
- `advanceToNextGame()`: Move to next card after reveal
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
