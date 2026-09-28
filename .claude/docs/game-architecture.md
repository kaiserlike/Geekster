# Game Architecture

## State Machine

The game uses a phase-based state machine defined in `src/lib/game.svelte.ts`:

```
Welcome → Playing → Result
```

### Phases

- **welcome**: Start screen with rules, language selector and the mode choice (Normal / Pro)
- **playing**: Active gameplay — placing games on the timeline
- **result**: The run is over — `endReason` is `outOfLives` or `poolCleared` (perfect run when
  there were no wrong placements). Shows score, stats and leaderboard. There is no win in solo

## Modes: Normal and Pro (Sprint 8)

`GameState.mode` is `normal | pro`. `startGame(mode)` sets it and fetches that tier's pool;
`restartGame()` ("Play Again") keeps it; `resetGame()` returns to the welcome screen, which picks
the mode again from the stored choice. The result screen shows a `PRO` badge, and during a run
the app header shows one beside the wordmark (`+layout.svelte` passes `pro` to `AppHeader`).

- **The choice** is stored in `localStorage['geekster-mode']` (`loadStoredMode()` / `storeMode()`
  in `src/lib/modes.ts`), read after hydration so the server's HTML and the first client render
  agree. `playableMode(chosen, proGate.open)` turns a stored Pro into Normal while the gate is
  closed — no error, and the stored value is left alone so it comes back when Pro opens
- **The Pro gate**: Pro is offered only when at least `PRO_MIN_POOL` (100, `src/lib/modes.ts`)
  games are live in Pro. Below that it is shown, disabled, as "Coming soon". It opens by itself
  when the count reaches the value — there is no switch
  - `/` has a server load (`src/routes/+page.server.ts`) that returns `getProGate()`: one `COUNT`
    over the same live rule as the pool query (`countLiveGames()` in `src/lib/server/liveGames.ts`),
    never the pool itself. A database error reads as closed
  - **Enforced on the server too**: `/api/games/random?difficulty=pro` answers 409 below the
    minimum (the whole-pool request's length is the count, so this is free), and
    `POST /api/scores` refuses a `pro` score with 409 while the gate is closed. The gate is about
    quality, not secrecy — `/api/games?difficulty=pro` stays open — but without it a stale tab or
    a typed URL could play a one-game "Pro run" and write it into the global Pro board. On a 409
    at start, `startGame()` re-runs the page load (`invalidateAll()`), so the welcome screen
    selects Normal and "Try again" plays Normal
  - `PRO_MIN_POOL_OVERRIDE` (server env) replaces the minimum **outside production only**
    (`resolveProMinPool()` ignores it when `VERCEL_ENV` is `production`). It exists so a Pro run
    can be played on staging and locally while production is still gated

## Core Game Loop (Playing Phase)

1. An anchor game is placed on the timeline with its year visible
2. A new game card appears (screenshot only, no year/name)
3. Player places the card in the timeline (click slot or drag-and-drop)
4. `placeGame(slotIndex)` checks placement correctness:
   - **Correct**: Game inserted at chosen position, streak increments; at every streak multiple of
     10 a life comes back if below 3 (`livesWonBack`, `lifeRegained` drives the heart animation)
   - **Wrong**: Game auto-inserted at correct position, life lost, streak resets
5. If placement was correct → bonus guess panel appears (guess year + name)
6. Score is calculated: base (100 for correct) + year bonus + name bonus, multiplied by streak;
   the bonuses depend on the mode
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
- `applyPlacement(counters, correct)`: lives, streak, best streak and lives won back after one
  placement — the streak grows first, so the 10th card in a row is the one that regains
- `streakMeter(streak, lives, maxLives)` (Sprint 9c): what the HUD's streak bar shows —
  `filled` (0–10: 10 at 10 and 20, 1 again at 11), `multiplier` (what the next correct card
  earns, `getStreakMultiplier(streak + 1)`), `socket` (a life is missing) and `toNextLife`
  (null with lives full)
- `hudMoment(placementCorrect, streak, lifeRegained)` (Sprint 9c): `wrong`, `lifeBack`,
  `tenInARow` or `none`. `GameScreen` passes `null` once the next card is up, so the moment
  lasts from the placement to "Next card". It picks the HUD's frame, the heart that breaks or
  returns, the bar's flash or drain, and the toast's tone
- `runOutcome(lives, remainingGames)`: `outOfLives` at 0 lives (even if the pool ran out on the
  same card), `poolCleared` when the pool is empty, otherwise `null`
- `isPerfectRun(endReason, wrongPlacements)`: a cleared pool with no wrong placement

The welcome screen's compact Top Scores falls back to the Classic list (labelled so) while a
browser has no endless score yet.

## Scoring System (src/lib/scoring.ts, tested in scoring.test.ts)

`scoreYearGuess()`, `scoreNameGuess()` and `calculateRoundScore()` take the mode as an optional
last argument (default `normal`). Decided 2026-09-27 (Sprint 8 decision 2):

| Part       | Normal                                                                                            | Pro                           |
| ---------- | ------------------------------------------------------------------------------------------------- | ----------------------------- |
| Base       | 100 for a correct placement, 0 for a wrong one                                                    | same                          |
| Year bonus | 50 exact, 30 / 20 / 10 at 1 / 2 / 3 years off, else 0                                             | 50 exact, 25 at 1 off, else 0 |
| Name bonus | 50 exact, 35 close (Dice ≥ 0.8), 20 title/subtitle alone, loose (Dice ≥ 0.5) or 4+ char substring | 50 exact, 35 close, else 0    |
| Streak     | ×1.0 at streak 1, +0.1 per step, capped at ×1.5                                                   | same                          |

**"Exact" forgives spelling that is not the name** (both modes): accents are folded (`Yōtei` =
`yotei`), apostrophes and punctuation dropped, a hyphen or space may be there or not
(`pac man` = `Pac-Man`), and a trailing disambiguating parenthesis is optional (`Doom` =
`Doom (2016)`). **"Close" needs the same numbers**: Roman numerals are read as digits
(`VII` = `7`) and a guess whose numbers differ from the title's is never close — "Far Cry 4" for
"Far Cry 3", "Portal 2" for "Portal" (slice-4 review). Normal's year curve was 40/30/20/10 down to ±4 before 2026-09-27.

## Drag-and-Drop

Past `COMPACT_TIMELINE_AT` (20, in `Timeline.svelte` since 9d) cards the timeline's year-first rows
drop their thumbnails and become one 40 px line (the card just placed stays full-size). Rows no
longer collapse while a drag is on: every slot grows to 60 px instead (in a compact timeline only
the drop target, to 52 px). On a phone the card to place shrinks to a strip while dragging.

Both live in the `DragPlace` class in `src/lib/dragPlace.svelte.ts` (since Sprint 9c). `GameScreen`
creates one instance and hands it to `CurrentCard` (the drag source) and `Timeline` (the slots, found
by `data-slot-index`). Two implementations coexist:

- **Desktop**: HTML5 Drag and Drop API (`draggable`, `ondragstart`, `ondragover`, `ondrop`)
- **Mobile**: Custom touch implementation with 250ms long-press activation, floating card clone, auto-scroll near edges
- **The desktop pane (9d)**: from 1024 px the timeline is its own scroll pane. `Timeline` registers
  it with `drag.setPane()`, and both kinds of drag then auto-scroll the pane in a 64 px zone at its
  edges (the page's zone is 150 px), with the same speed curve; `drag.paneEdge` drives the
  "▲/▼ SCROLLING" cue. HTML5 `dragover` on the pane feeds it; `dragleave` out of the pane and
  `dragend` stop it. The decade ruler scrolls the pane on click and on a drag hovering a decade
  (`ondragenter` for HTML5, `elementFromPoint` + `data-scroll-to` for touch). `dragStart` sets
  `isDragging` a tick late, since restyling the drag source inside `dragstart` can make Chrome
  cancel the drag

### The reveal's one scroll

The pane never scrolls towards an answer: between cards it keeps its position (the browser's
scroll anchoring holds the visible rows in place when rows or slots change above them). Only the
reveal moves it, through `Timeline.revealInView()`: to the card just placed, and on a miss to its
ghost too when both fit in the pane; otherwise it follows the card to where it belongs. Nothing
moves when they are already in view. On a phone, a correct placement scrolls the page to the top
(the bonus panel, then the answer card), a miss scrolls to the ghost and the card, and "Next card"
goes back to the top

## Data Flow

```
GET /  (server load)              →  proGate { open, count, min } → WelcomeScreen mode choice
GET /api/games/random?count=1000&difficulty=<mode>
                                  →  anchor (1) + the rest of the shuffled live pool of that tier
   (on error: no round starts — the player sees the error and can retry; 409 = Pro closed)
                                           ↓
                                    timeline (grows) ← placeGame()
                                           ↓
                                    scoring(mode) → leaderboard: localStorage `geekster-leaderboard-<mode>`
                                              (old 10-game `geekster-leaderboard` read-only "Classic",
                                              shown under Normal only); POST /api/scores with difficulty;
                                              the Global tab reads /api/scores?difficulty=<mode>
```

## Key Functions (game.svelte.ts)

- `startGame(mode)`: Initialize a new run of that mode with its shuffled pool
- `placeGame(slotIndex)`: Place current game, check correctness, update state
- `advanceToNextGame()`: Move to next card after reveal, or end the run via `runOutcome()`
- `restartGame()`: Start new game in the same mode without going to welcome screen
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
- `src/lib/server/blob.ts` — every admin upload is `screenshots/<slug>-<random>.webp`, a
  pathname that has never existed (the seed images from `blob:migrate` are plain `<slug>.webp`).
  Deleting a row deletes the blob unless the URL is a local path or another stage's
- `src/lib/server/rawg.ts` — search is proxied through `/api/admin/rawg`; only `rawg.io` images
  may be downloaded
- Two tiers, Normal and Pro (migration `0003`). Exactly one screenshot per **(game, tier)** is
  primary: `reconcilePrimaries()` (`src/lib/screenshotTiers.ts`) after every mutation, backed by
  a partial unique index. `/api/games/random?difficulty=` serves games with a primary of that
  tier (default `normal`; the game asks for its mode since slice 4). A game without a Normal primary
  never reaches a round; the dashboard counts live games per tier
