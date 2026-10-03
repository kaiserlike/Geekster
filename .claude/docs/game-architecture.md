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
  there were no wrong placements). Shows the headline, score and stats, then Play again / Menu
  above the fold, then the leaderboard and the final timeline, the run's misses
  (`GameState.missedIds`, filled by `placeGame()`) framed red and marked ✗ (9e). There is no win in solo

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
  - **Enforced on the server too**: `POST /api/runs` with `mode: 'pro'` answers 409 below the
    minimum (`createRun()` reads the whole pool anyway, so its length is the count). Since every
    score is written by the server at the end of a run (10b), no Pro score can reach the board
    without a Pro run. On a 409 at start, `startGame()` re-runs the page load
    (`invalidateAll()`), so the welcome screen selects Normal and "Try again" plays Normal
  - `PRO_MIN_POOL_OVERRIDE` (server env) replaces the minimum **outside production only**
    (`resolveProMinPool()` ignores it when `VERCEL_ENV` is `production`). It exists so a Pro run
    can be played on staging and locally while production is still gated

## First run (Sprint 9e)

The welcome screen shows the pitch to a first-time visitor and "Welcome back, your best: N CR"
plus the leaderboard to a returning one (`hasPlayedBefore()` in `leaderboard.ts`: any local
entry, Normal, Pro or Classic). The rules sit behind "How to play" (`HowToPlay.svelte`).

On the first card of the first run, `CoachMark.svelte` sits between the card and the timeline:
"<anchor> is from <year>. Older? Put it above. Newer? Below." It goes with the first placement
or its ✕, which write `localStorage['geekster-coach-seen'] = '1'` (`src/lib/firstRun.ts`). A
browser with a finished run counts as having seen it, and blocked storage shows it never.

## Core Game Loop (Playing Phase)

1. An anchor game is placed on the timeline with its year visible
2. A new game card appears (screenshot only, no year/name)
3. Player places the card in the timeline (click slot or drag-and-drop)
4. `placeGame(slotIndex, onPlaced)` sends the slot to the referee, which decides (see § The
   referee):
   - **Correct**: Game inserted at chosen position, streak increments; at every streak multiple of
     10 a life comes back if below 3 (`livesWonBack`, `lifeRegained` drives the heart animation)
   - **Wrong**: Game auto-inserted at correct position, life lost, streak resets
5. If placement was correct → the card turns into its verdict for 1 s, then into the bonus
   guess panel (guess year + name)
6. Score is calculated: base (100 for correct) + year bonus + name bonus, multiplied by streak;
   the bonuses depend on the mode
7. The answer card shows the game's name, year and the round's breakdown until "Next card"
   (a miss skips 5–7: its verdict is pinned above the timeline, the ghost marks the chosen slot)
8. `advanceToNextGame(onNext)` asks the referee for the next card, or the end

### The round's stage (GameScreen)

Between one card and the next, `GameScreen` holds one `stage: RoundStage` (`types.ts`, since 9f;
it replaced four booleans): `card` → `verdict` → `bonus` → `reveal` for a correct placement,
`card` → `reveal` for a miss. `Timeline` takes the stage too: the card just placed shows `????`
through `verdict` and `bonus` (the name and year are the bonus question), and is framed
turquoise or red in `reveal`. The drag is only on in `card`. `verdictShown` is the one extra
flag: a phone first scrolls to the card, which still shows as it was until the verdict is up 9. `runOutcome(lives, remaining)` ends the run at 0 lives or an empty pool — never at a number of
placements. Solo is endless (Sprint 8)

## The referee (Sprint 10b)

The server decides every placement and scores every bonus; the client never holds an answer
before it is due. A run's state lives in a `runs` row (a serverless function keeps nothing
between requests). The id is 32 random hex characters and the run's only credential.

| Call                                                        | The server (`src/lib/server/runs.ts`)                                                         | Answers                                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `POST /api/runs {mode}`                                     | checks the Pro gate, shuffles the live pool (`ORDER BY RANDOM()`), stores the ids             | `runId`, the anchor with name and year, the first card **as an image only**, `remaining`  |
| `POST /api/runs/:id/place {position, slot}`                 | `place()`: `isPlacementCorrect` / `findCorrectIndex` / `applyPlacement` on the run's timeline | the verdict, `insertAt`, the counters; the answer and the (zero) round **only on a miss** |
| `POST /api/runs/:id/bonus {position, yearGuess, nameGuess}` | `scoreBonus()`: `calculateRoundScore`, or skipped when past `bonus_deadline`                  | the answer, the round's breakdown, the total, `late`                                      |
| `POST /api/runs/:id/next {position}`                        | `advance()`: `runOutcome`; at the end updates the run and inserts `scores` in one batch       | the next card (image only) and `remaining`, or `{ over, endReason }`                      |

- **Card ids are run positions.** The anchor is 0, the first card 1, … — the client never sees
  a game's database id (seed ids partly follow the release order). `position` in every body
  names the card the request is about
- **Every write is conditional** on the `stage` and `position` it read
  (`UPDATE … WHERE id AND stage AND position … RETURNING`), so a double tap, a retry or a second
  tab is refused with 409 rather than applied twice. Stages: `placing → bonus → revealed`
  (a miss: `placing → revealed`) `→ placing` or `over`. Verified with 8 parallel duplicates of
  each call: one 200, seven 409, one `scores` row
- **The timeline is not stored**: it is the first `position` games of `game_ids`, sorted by
  year. The client's timeline is always year-sorted too, so slot indices agree
- **The bonus window is the server's**: `bonus_deadline` = the verdict + 30 s + 5 s slack
  (`BONUS_SLACK_MS`: the 1 s verdict, a phone's scroll, the round trip). A later guess still
  counts the placement's 100 but no bonus. The panel's countdown is the display only
- **The score is written once, by the server**, when `next` ends the run: the run's update and
  `INSERT … ON CONFLICT (run_id) DO NOTHING` in one `db.batch`. `player_name` is `Anonymous`
  until 10c
- All transitions are pure functions in `src/lib/server/runRules.ts`, tested in
  `runRules.test.ts`; they import `placement.ts` and `scoring.ts`, never copy them
- **On the client** (`game.svelte.ts`): one request at a time (`GameState.pending`; input is
  ignored meanwhile). A correctly placed card enters the timeline with no name and its
  neighbour's year until the bonus answers (the row is `????` then). Each action takes the
  screen's follow-up as a callback run in the same tick as the state change, so nothing renders
  in between. Past 300 ms a pending request shows (`CHECKING…` on the card, a spinner on the
  bonus or Next button, decision 10b-2). A failure sets `GameState.runError`: `error.runRetry`
  (offline, 5xx — the same move can be repeated) or `error.runLost` (404/409/410 — a Menu button)
- Runs are never deleted; an abandoned run is a row stuck in `placing` or `bonus`

## Placement Logic (src/lib/placement.ts)

Pure functions, unit-tested in `placement.test.ts`; since 10b the server (`runRules.ts`) applies
their results and the client only shows them.

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
  returns, the bar's flash or drain, and the verdict's tone (`placementVerdict()` in `GameScreen`)
- `runOutcome(lives, remainingGames)`: `outOfLives` at 0 lives (even if the pool ran out on the
  same card), `poolCleared` when the pool is empty, otherwise `null`
- `isPerfectRun(endReason, wrongPlacements)`: a cleared pool with no wrong placement

The welcome screen's board shows the chosen mode's local list only; the Classic list has its own
tab in `Leaderboard` (under Normal, when this browser still has one).

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
- **HTML5 auto-scroll (9d)**: one column on every screen, so both kinds of drag scroll the page
  in a 150 px zone at the viewport's top and bottom, with the same speed curve. HTML5 feeds it
  from a `dragover` on the window (`drag.windowDragOver`, in `Timeline`); leaving the window and
  `dragend` stop it. `drag.scrollEdge` drives the "▲/▼ SCROLLING" cue. The decade ruler scrolls
  on click and on a drag hovering a decade (`ondragenter` for HTML5, `elementFromPoint` +
  `data-scroll-to` for touch). `dragStart` sets `isDragging` a tick late, since restyling the drag
  source inside `dragstart` can make Chrome cancel the drag
- **The pinned bar**: once the card to place has scrolled off, `CurrentCard` pins a bar to the top
  with the compact HUD (`pinnedHud` snippet from `GameScreen`) and the card's strip, itself a drag
  source. While dragging the in-flow card shrinks to the strip, unless it has scrolled off
- **The decade ruler** (from 1280 px): `DecadeRuler.svelte` only draws the buttons; whether it
  shows, the decade in view, each decade's height and the jump are the `DecadeRulerState` class
  in `src/lib/decadeRuler.svelte.ts` (pulled out of `Timeline` in 9f), which re-measures through
  a `ResizeObserver` on the list and the page

### The reveal's one scroll

The page never scrolls towards an answer. A correct placement scrolls to the top (the bonus
panel, then the answer card); "Next card" goes back to the top. A miss goes through
`Timeline.revealInView()`: the card just placed and its ghost, centred when both fit, otherwise
the scroll follows the card to where it belongs; nothing moves when they are already in view.

## Data Flow

```
GET /  (server load)              →  proGate { open, count, min } → WelcomeScreen mode choice
POST /api/runs {mode}             →  runId, anchor (name, year), first card (image only)
   (on error: no round starts — the player sees the error and can retry; 409 = Pro closed)
                                           ↓
   POST …/place {position, slot}   →  verdict (+ answer on a miss)   → timeline (grows)
   POST …/bonus {guess}            →  answer + round score (scored on the server)
   POST …/next  {position}         →  next card (image only) | over → server writes `scores`
                                           ↓
                                    result → leaderboard: localStorage `geekster-leaderboard-<mode>`
                                              (old 10-game `geekster-leaderboard` read-only "Classic",
                                              shown under Normal only); the Global tab reads
                                              /api/scores?difficulty=<mode>
```

## Key Functions (game.svelte.ts)

Every action is a request to the referee; the callback runs in the same tick as the state change.

- `startGame(mode)`: `POST /api/runs` — the anchor and the first card
- `placeGame(slotIndex, onPlaced)`: the verdict, applied to the timeline and the counters
- `submitBonusGuess(guess, onScored)` / `skipBonusGuess(onScored)`: the answer and the round score
- `advanceToNextGame(onNext)`: the next card, or the result (the server ended the run)
- `restartGame()`: Start new game in the same mode without going to welcome screen
- `resetGame()`: Return to welcome screen (also the way out of a lost run)

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
  own the slug (admin URLs, `db:seed`'s key — never a blob name)
- `src/lib/server/blob.ts` — every upload is `screenshots/<random>.webp`, a pathname that has
  never existed and doesn't name the game (Sprint 10a; `blob:migrate` does the same).
  Deleting a row deletes the blob unless the URL is a local path or another stage's
- `src/lib/server/rawg.ts` — search is proxied through `/api/admin/rawg`; only `rawg.io` images
  may be downloaded
- Two tiers, Normal and Pro (migration `0003`). Exactly one screenshot per **(game, tier)** is
  primary: `reconcilePrimaries()` (`src/lib/screenshotTiers.ts`) after every mutation, backed by
  a partial unique index. A run's pool (`POST /api/runs`) is the games with a primary of its
  mode's tier. A game without a Normal primary
  never reaches a round; the dashboard counts live games per tier
