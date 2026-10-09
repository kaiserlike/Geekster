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
| `POST /api/runs {mode, deviceId}`                           | checks the Pro gate, shuffles the live pool (`ORDER BY RANDOM()`), stores the ids             | `runId`, the anchor with name and year, the first card **as an image only**, `remaining`  |
| `POST /api/runs/:id/place {position, slot}`                 | `place()`: `isPlacementCorrect` / `findCorrectIndex` / `applyPlacement` on the run's timeline | the verdict, `insertAt`, the counters; the answer and the (zero) round **only on a miss** |
| `POST /api/runs/:id/bonus {position, yearGuess, nameGuess}` | `scoreBonus()`: `calculateRoundScore`, or skipped when past `bonus_deadline`                  | the answer, the round's breakdown, the total, `late`                                      |
| `POST /api/runs/:id/next {position, name}`                  | `advance()`: `runOutcome`; at the end updates the run and inserts `scores` in one batch       | the next card (image only) and `remaining`, or `{ over, endReason, standing }`            |

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
  `INSERT … ON CONFLICT (run_id) DO NOTHING` in one `db.batch`, with the run's `device_id` and
  the `name` the last `next` carried if it passes `checkName()`, else `Anonymous` (see § The
  global board)
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
- `dailyProgress(marks, cardUp)` in `daily.ts`: the Daily HUD's card number and its ten squares
  (`hit`, `miss`, `current`, `open`). `GameState.marks` grows by `o`/`x` with every `place`
  answer, and a resumed Daily starts from `RunResume.marks`; the last `next` answers the same
  string
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

## The Daily Run (Sprint 10d)

One set a day for everyone: the anchor and 10 cards from the Normal pool, 3 lives, Normal
scoring. A Daily Run is an ordinary refereed run with `runs.mode = 'daily'` (it plays as
`normal`: `toRecord()` maps it) and `runs.daily_date`; nothing in `runRules.ts` knows about it —
the run ends after its 10th card because `game_ids` holds 11 games (`runOutcome` says
`poolCleared`, shown as "Daily Run complete!").

- **The day** turns at midnight UTC (10d-1); `utcDay()`, `msUntilNextDaily()` in `src/lib/daily.ts`
- **The set** (`todaysDaily()` in `src/lib/server/daily.ts`): the day's first request draws it
  with `pickDaily()` — round-robin over the decades in a random order, leaving out the games of
  the last 30 Dailies while the pool has enough — and writes it into `daily_challenges` with
  `INSERT … ON CONFLICT DO NOTHING`, then reads it back, so two first requests agree. `number` =
  days since the first row + 1. Publishing a game mid-day doesn't change the day's set
- **One attempt per device**: the partial unique index `runs_device_daily_unique`
  (`device_id, daily_date WHERE daily_date IS NOT NULL`); a Daily without a device id is refused
  (400). `POST /api/runs {mode: 'daily'}` for a device that has today's run: **resumes** it if it
  is unfinished — an open bonus is scored as skipped and a revealed card is moved past with the
  same rules a request would use; if that ends the run, it is finished and the answer is 409 —
  and answers 409 (`daily played`) once it is over. Two tabs starting at once get one run (the
  insert's conflict makes the loser resume)
- **`runs.marks`**: `o` / `x` per placed card, appended by `place()`; the result screen's squares,
  the welcome card's, and the share row (10e)
- **The score** goes on today's Daily board: `scores.difficulty = 'daily'`, `scores.daily_date`;
  `GET /api/scores?difficulty=daily` (period ignored). The standing at the end is
  `scope: 'today'` — "Place N of M players today"
- **`GET /api/daily?device=`** (`dailyStatus()`): `#N`, `msUntilNext`, the device's day streak
  (`dailyStreak()` over its finished Daily days; today not yet played doesn't break it), and its
  run of today: none, `{ over: false }` (the card says "Continue"), or the result with its rank
- **On the client**: `startGame('daily')` sets `GameState.daily` (`{ number, date }`) and applies
  `resume`; `restartGame()` doesn't replay a Daily. The app header shows `DAILY #N` during it.
  The result screen shows the squares and "Today's board" instead of Play again, and keeps the
  run off the local endless lists

## The global board (Sprint 10c)

No accounts (decision 6). Who a player is lives in two `localStorage` keys
(`src/lib/player.svelte.ts`): `geekster-device-id` (32 random hex, made on the first run, sent
with `POST /api/runs`, stored on `runs` and `scores`, never published — an identifier, not a
credential) and `geekster-player-name` (missing = never asked, `''` = asked and not given).

- **The board is each device's best** per mode (decision 2026-10-04): `boardPage()` in
  `src/lib/server/scores.ts` partitions `scores` by `COALESCE(device_id, 'row:' || id)` (a row
  without a device is a player of its own), keeps each player's highest score (the earlier one
  on a tie), and ranks with `RANK()` (ties share a rank). `GET /api/scores?difficulty&period&page&device`
  answers a page of 20 (`BOARD_PAGE_SIZE`, at most 50 pages), the player count, and `me`: the
  asking device's own row and its page, wherever it is. `period=week` = since Monday 00:00 UTC
  (`weekStart()` in `src/lib/globalBoard.ts`, tested). The rows never carry `run_id` or
  `device_id`; `mine` marks the device's own
- **The name (10c-1)** is asked once, on the result screen of the first run that ends without
  one: the score is already written as `Anonymous`, and `POST /api/runs/:id/name {name}` names
  it (only while it is `Anonymous`: 409 otherwise, 404 for no score, 400 with `problem` for a
  refused name). The question is remembered as asked the moment it shows. From then on every
  `next` sends the stored name, and the server puts it on the score at the end of the run.
  `/leaderboard` changes the stored name for later runs
- **A name is a snapshot (10c-3):** each score keeps the name it was written with; a rename never
  rewrites one, and a row the admin deleted stays deleted
- **The rules (10c-2)**, `checkName()` in `src/lib/playerName.ts`, run in the browser and on the
  server: 2–20 characters (letters of any script, digits, space, `.` `_` `-`), whitespace
  collapsed, NFC; a short DE + EN block list matched after folding case, accents and leetspeak —
  long terms anywhere, short ones as a whole word only (`Assassin`, `Ignazio` pass), and
  reserved names (`Anonymous`, `Admin`, `Geekster` …) as the whole name only. The admin's delete
  (`/admin/scores`) is the backstop
- **The standing after a run:** the last `next` answers `standing` (`standingOf()`): the
  device's all-time rank among the players, the player count, its best and its best before this
  run. The result screen shows "#N of M worldwide" and "New personal best" or "Your best". If it
  cannot be worked out it is `null` and the screen falls back to the local rank — the score is
  written either way

## Data Flow

```
GET /  (server load)              →  proGate { open, count, min } → WelcomeScreen mode choice
POST /api/runs {mode, deviceId}   →  runId, anchor (name, year), first card (image only)
   (on error: no round starts — the player sees the error and can retry; 409 = Pro closed)
                                           ↓
   POST …/place {position, slot}   →  verdict (+ answer on a miss)   → timeline (grows)
   POST …/bonus {guess}            →  answer + round score (scored on the server)
   POST …/next  {position, name}   →  next card (image only) | over → server writes `scores`
                                       (name, device) and answers the device's standing
                                           ↓
                                    result → leaderboard: localStorage `geekster-leaderboard-<mode>`
                                              (old 10-game `geekster-leaderboard` read-only "Classic",
                                              shown under Normal only); the Global tab reads
                                              /api/scores?difficulty=<mode>&device=<id>
                                    first run without a name → POST …/name {name}
                                    /leaderboard → /api/scores?difficulty&period&page&device
```

## Key Functions (game.svelte.ts)

Every action is a request to the referee; the callback runs in the same tick as the state change.

- `startGame(mode)`: `POST /api/runs` — the anchor and the first card
- `placeGame(slotIndex, onPlaced)`: the verdict, applied to the timeline and the counters
- `submitBonusGuess(guess, onScored)` / `skipBonusGuess(onScored)`: the answer and the round score
- `advanceToNextGame(onNext)`: the next card, or the result (the server ended the run) and the
  device's `standing`
- `nameFinishedRun(name)`: names the finished run's score and keeps the name (10c-1)
- `restartGame()`: Start new game in the same mode without going to welcome screen
- `resetGame()`: Return to welcome screen (also the way out of a lost run)

## i18n (src/lib/i18n.svelte.ts)

- Two languages: English (en) and German (de)
- Locale stored in reactive state with `$state`
- `t(key)` function returns translated string
- `getLocale()` / `setLocale()` for language switching
- Components use `LangSwitch.svelte` for the toggle UI

## Sharing a result (Sprint 10e)

Client only, apart from one anonymous count (10f): the text and the card never leave the browser
except through the player's own share.

- **What is shared** — `ShareResult` (`src/lib/share.ts`): a Daily (`number`, `score`, `marks`,
  today's `rank`) or an endless run (`mode`, `score`, `bestStreak`, `livesWonBack`, `marks`, the
  all-time `rank`). The result screen builds it from `GameState` (`standing` gives the rank); the
  welcome screen's done Daily card from `GET /api/daily`'s `today`
- **The text** — `shareText(result, locale)`: no game names, no years. A Daily's row is
  🟩 / 🟥 per `marks`, padded to `DAILY_CARDS` with ⬛ when the run ended early. The link is
  always `SHARE_URL` (`https://geekster.pro`)
- **The card** — `renderShareCard()` (`src/lib/shareCard.ts`) draws a 1200×630 PNG on a canvas
  with the page's own fonts (`document.fonts.load()` first); its copy and squares come from the
  pure `shareCardLayout()`. `ShareButton` draws it as soon as it mounts, because a phone opens
  its share sheet only close to the tap (transient activation)
- **The button** — a coarse pointer with `navigator.share`: `share({ text, files: [png] })`, the
  file only where `canShare({ files })`; an `AbortError` (the sheet closed) is ignored, any
  other error falls back to the clipboard. Otherwise `navigator.clipboard.writeText()`, a
  "Copied" note with a "Download image" link to the PNG's object URL; a failed copy shows the
  text in a read-only field
- **The count (10f)** — after a share that went through (the sheet resolved, the copy
  succeeded, the download link clicked), `report(method)` sends `POST /api/share
{ kind, method }` with `keepalive`, without waiting. `parseShareEvent()` (`share.ts`, tested)
  takes only a known kind and method; `countShare()` upserts `share_counts (date, kind, method)`
  with `count + 1`. A closed sheet counts nothing. The admin dashboard reads it with
  `getActivity()`
