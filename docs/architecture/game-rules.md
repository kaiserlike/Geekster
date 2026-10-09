# Game rules

What the game does and why: the rules a player meets, and where each lives in the code.
The code-level flow (state machine, the referee's protocol, key functions) is in
`game-architecture.md`.

- **Game data:** the `games` table (Turso). The count changes constantly and is not recorded here — the admin dashboard shows it. A game is live **in a tier** only when it is **published AND has a primary screenshot of that tier** (Normal or Pro, since migration `0003`) — a run's pool (`POST /api/runs`) and `/api/admin/games` require both, for the tier of the mode. The game asks for the mode the player chose (see **Modes**). The client starts a run at `POST /api/runs`; if that fails there is no game — `GameState.error` holds a translation key, the phase stays `welcome`, and `WelcomeScreen` shows the message with the start button turned into a retry. There is deliberately no client-side fallback dataset
- **Flow:** Welcome → Playing → Result
- **The server is the referee (Sprint 10b).** A run lives in a `runs` row; the client gets a run
  id and, per card, **an image only** (its id is its position in the run). `POST /api/runs`,
  then `/api/runs/:id/place`, `/bonus`, `/next`: the server decides the slot, scores the bonus
  (30 s + 5 s slack, `bonus_deadline`; late counts as skipped) and, when the run ends, writes
  `scores` itself. A card's name and year arrive with the bonus answer, or with the verdict on a
  miss. Every write is conditional on the stage and position it read, so a double tap or a
  second tab gets 409. The rules are pure in `src/lib/server/runRules.ts` and import
  `placement.ts` / `scoring.ts`; the browser scores nothing. Input locks during a request; past
  300 ms the card says "Checking…" (decision 10b-2). `/api/games` is admin-only now
  (`/api/admin/games`, decision 10b-3): it maps an image URL to its answer. Full protocol:
  `game-architecture.md` § The referee
- **Core mechanic:** Player places games in a timeline. The first game is an anchor (year visible). Subsequent games must be placed in the correct chronological position relative to existing timeline entries.
- **Reveal flow:** After correct placement, bonus guess panel appears (year + name), then score reveal (~2s), then next game
- **Modes (Sprint 8 slice 4):** Normal and Pro, chosen on the welcome screen (`ModeChoice.svelte`)
  and remembered in `localStorage['geekster-mode']`. `GameState.mode` is set by
  `startGame(mode)`; "Play Again" keeps it; during a run the app header shows a `PRO` badge
  beside the wordmark (since 9c), and the result screen shows one too.
  Pro draws only games with a Pro primary (`?difficulty=pro`) and scores the bonuses strictly.
  Lives, life regain and the 30 s timer are the same in both
- **First run (Sprint 9e):** the welcome screen shows the pitch to a first visit, and "Welcome
  back, your best: N CR" with the leaderboard to a browser that has a finished run
  (`hasPlayedBefore()`); the rules are behind "How to play". On the first card of the first run a
  **coach mark** (`CoachMark.svelte`) sits between the card and the timeline ("Portal is from 2007. Older? Above. Newer? Below."); the first placement or its ✕ writes
  `localStorage['geekster-coach-seen']` (`src/lib/firstRun.ts`), next to `geekster-mode`. A
  browser with a finished run never sees it
- **The Pro gate:** Pro is offered only once **`PRO_MIN_POOL` = 100** games are live in Pro
  (`src/lib/modes.ts`, decision 1, 2026-09-27); below that it is shown, disabled, as "Coming
  soon". It opens **by itself** when the count reaches 100 — no switch. `/` has a server load that
  returns `getProGate()` (one `COUNT`, never the pool). **The server enforces it too:**
  `POST /api/runs` with `mode: 'pro'` answers 409 while it is closed, and only a run writes a
  score, so a stale tab cannot play a tiny Pro pool into the global board. A stored Pro choice while
  closed plays Normal without an error (`playableMode()`), and the stored value is kept.
  `PRO_MIN_POOL_OVERRIDE` (server env) lowers the minimum **outside production only** — it is
  ignored when `VERCEL_ENV` is `production`, so there is no public switch
- **Scoring:** Base 100 for correct placement + year bonus + name bonus, multiplied by streak
  (1.0–1.5x). Decision 2 (2026-09-27): **Normal** year 50 / 30 / 20 / 10 at 0 / 1 / 2 / 3 years
  off, else 0 (was 50 − 10 per year); name 50 exact, 35 close (Dice ≥ 0.8), 20 for a
  title/subtitle alone, a loose match or a substring. **Pro** year 50 exact, 25 at ±1, else 0;
  name 50 exact, 35 close, else 0. "Exact" in both folds accents (`Yōtei` = `yotei`), drops
  apostrophes and punctuation, ignores a missing or extra hyphen/space, and makes a trailing
  "(2016)" optional. **"Close" needs the same numbers** (Roman numerals read as digits): "Far Cry
  4" for "Far Cry 3" is a different game, so 0 in Pro and at most the loose 20 in Normal
- **Endless solo (Sprint 8):** there is no win and no placement target. A run ends at 0 lives, or
  when the pool runs out. The server shuffles the **whole live pool** into the run's
  `game_ids` at its start; the client never holds it
- **Lives:** 3 lives; wrong placement costs 1 life, resets streak. **Every streak of 10 gives one
  back** while below 3 (`regainsLife()` in `placement.ts`), with a heart animation and the ♥ verdict on the card
- **The HUD shows the streak's two effects apart (2026-10-09, player feedback, design 2D).**
  Players read the old 10-segment streak bar as "cards placed" and were thrown when a miss
  emptied it. `RunHud` shows the hearts, the score in **Credits (CR)**, "Card N · Multiplier"
  with the streak as a 🔥 count, and a **multiplier ladder** of six labelled steps (×1.0–×1.5,
  `MultiplierLadder`): the lit top step is the multiplier the next correct card earns, and a miss
  drops it to ×1.0. While a life is missing, the **first empty heart charges**: it fills from
  the bottom, one tenth per card in a row, with "N/10" beside it, and becomes a full heart at 10.
  Both come from the pure `streakMeter(streak, lives, maxLives)` in `placement.ts`. "Card N"
  counts the anchor, as the incoming card's label does. `hudMoment()` names the moment between a
  placement and the next card (`wrong`, `lifeBack`, `tenInARow`), which frames the HUD red or
  pink, breaks or returns a heart, and drains or flashes the ladder. Placement
  feedback is **the card itself** (9d, user idea): after a correct placement the card to place
  turns into its verdict (✓ "Correct +100 · streak N", ♥ for a life back, ★ for ten in a row) for
  1 s, then into the bonus round; a miss shows a red one-line verdict with the answer, pinned
  while the page scrolls to the ghost. A `sr-only` polite live region in `GameScreen` speaks it.
  There is no toast any more. "Placed" is gone: the count is the timeline's heading, "Your
  timeline · N"
- **The Daily HUD shows progress instead of the ladder (2026-10-09).** In a Daily, with exactly
  10 cards, progress is what a player looks for. So `RunHud` given `daily` swaps
  the ladder for `DailyProgress`: "Card N / 10" and one square per card (turquoise right, red
  missed, the card up now outlined pink; `dailyProgress()` in `daily.ts`, from the run's
  `marks`), the streak as a 🔥 count beside the ×multiplier chip. Nothing empties on a miss. No
  heart charges: ten cards never reach a life back. The incoming card's "Card N" counts the same
  way (the anchor is not one of the ten)
- **Pool cleared ≠ error.** Running out of games with lives left ends the run as `poolCleared`:
  "Perfect run!" with zero wrong placements, "Pool cleared!" otherwise. Losing the last life on the
  last card is still game over. `GameState.endReason` records which
- **Long timelines:** past 20 cards (`COMPACT_TIMELINE_AT` in `Timeline.svelte`, since 9d) the
  playing timeline's year-first rows lose their thumbnails and become 40 px lines; the card just
  placed stays full-size. The result screen's timeline is always the compact rows, the run's misses
  (`GameState.missedIds`) framed red and marked ✗, 14 rows then "+ N more" (9e)
- **The playing screen (Sprint 9d): one column on every screen** (user decision, 2026-09-28,
  after a two-column desktop felt unintuitive): HUD, the card to place, the timeline under it,
  dragged top to bottom, the page scrolling. A desktop gets the same column larger, within 880 px
  (header aligned to it); the card's width is also capped by the window height,
  `(100dvh − 26rem) · 16/9`, so the first slot stays in view. Once the card has scrolled off, a
  bar pinned to the top carries the compact HUD and the card's strip (which can be dragged). While
  dragging, the card shrinks to that strip and the HUD goes compact. From 1280 px a **decade
  ruler** stands to the right of the column (from 8 cards, once the page scrolls, two decades or
  more). A click on the card (or its ⤢ button) opens it full size in `ui/Lightbox`. **The page
  never scrolls towards an answer:** it scrolls to the top for the bonus panel, the answer card and
  the next card, and on a miss to the ghost and the card. The HUD collapses into the header
  (`headerScore`) while a bonus field has focus on a coarse pointer
- **The Daily Run (Sprint 10d):** one set a day for everyone, **11 games (the anchor and 10 cards)**,
  3 lives, the Normal pool and Normal scoring, numbered #1, #2, … from the first Daily. The day
  turns at **midnight UTC** (10d-1). The set is drawn by the day's first request (`todaysDaily()`
  in `src/lib/server/daily.ts`, written once into `daily_challenges`), round-robin over the
  decades and without the games of the last 30 Dailies (`pickDaily()` in `src/lib/daily.ts`,
  tested). **One attempt per device and day**, enforced by the unique `(device_id, daily_date)`
  index on `runs`; a private window or cleared storage is a new device and can play again —
  accepted as a known limit (user, 2026-10-04). A Daily Run is a refereed run with
  `runs.mode = 'daily'`: starting it again **resumes** the device's unfinished one (an open bonus
  counts as skipped), and once finished it answers 409. It ends after the 10th card (`poolCleared`
  = "Daily Run complete!") or at 0 lives; its score is on **today's Daily board**
  (`scores.difficulty = 'daily'`, `daily_date`), not Normal's, and stays off the local endless
  lists. `runs.marks` keeps a hit (`o`) or miss (`x`) per card for the result's squares and the
  share row (10e). The welcome screen is design A: a pink **Daily Run card** (the streak 🔥, play
  / continue, or the result with "Place N of M players today" and today's board) above a
  turquoise **Endless Run card** (Normal/Pro, START RUN). `GET /api/daily?device=` feeds it
- **Sharing (Sprint 10e):** a Share button on the result screen (Daily and endless) and an icon
  beside "Today's board" on the done Daily card. It shares a spoiler-free text (`shareText()` in
  `src/lib/share.ts`: the Daily's 🟩/🟥 row padded with ⬛, or mode, score, best streak and rank;
  always `https://geekster.pro`) and a 1200×630 PNG drawn **in the browser on a canvas**
  (`renderShareCard()` in `src/lib/shareCard.ts`, after the Sprint 9 share-card board; no server
  image, so a link's preview stays the static OG image). A coarse pointer with `navigator.share`
  opens the share sheet with both; everything else copies the text and offers "Download image".
  No `localStorage` key is added. **Sharing is counted, anonymously (Sprint 10f, decision 10f-1:
  our own counts, no tracker):** each share by the sheet, the clipboard or the image download
  sends `POST /api/share {kind, method}`, which adds one to `share_counts` for the UTC day — no
  device id, no run, no IP, not the text. Vercel Web Analytics was considered: on Hobby it has
  page views only (no custom events, 50,000 a month), and the game is one page. The admin
  dashboard shows the last 7 days from `runs` and `share_counts` (runs started / finished, Daily
  players / finished, shares, downloads, the Daily share rate); the privacy page says so
- Multiplayer (Milestone 13) may bring back a fixed placement goal
- **Wrong placement:** The game is auto-inserted at its correct position; no bonus guess offered.
  A red dashed "You put it here" ghost marks the slot the player chose (`ghostSlotIndex()`), and
  the card slides from there to where it belongs (framed red, "Belongs here")
- **Drag-and-drop:** HTML5 DnD on desktop, touch long-press (250ms) on mobile with auto-scroll
- **Leaderboard:** one local list per mode, `geekster-leaderboard-normal` and
  `geekster-leaderboard-pro`. The old 10-game list under `geekster-leaderboard` is never
  written again and is shown read-only as a "Classic" tab — under Normal only — when a browser
  still has one. The global `/api/scores` has no run-type column; its two pre-endless rows were
  deleted at the slice-1 release (2026-09-26) rather than add one. It is split by mode instead:
  `scores.difficulty` = the run's mode, and the Global tab reads
  `GET /api/scores?difficulty=<mode>` (without the parameter: every mode, as before). **There is
  no `POST /api/scores` since 10b:** the server writes the row when it ends a run (`run_id`
  unique), and the GET lists the board's columns only, not `run_id` / `device_id`. Normal scores
  from before 2026-09-27 were made with the softer year curve
- **The global board (Sprint 10c)** shows **each device's best** per mode, all-time or this week
  (Monday 00:00 UTC), 20 a page, at `/leaderboard` and on the Global tab. No accounts: a random
  `geekster-device-id` goes with every run (an identifier, not a credential, never published),
  and the display name `geekster-player-name` with every `next`. **The name is asked once**, on
  the result screen of the first run without one (decision 10c-1): that score is already
  "Anonymous" and `POST /api/runs/:id/name` names it; later runs carry the name. **A name is a
  snapshot per score** (10c-3): `/leaderboard` changes it for later runs only. **The rules**
  (10c-2, `checkName()` in `playerName.ts`, browser and server): 2–20 letters/digits/space/`.`/
  `_`/`-`, a short DE + EN block list after folding case, accents and leetspeak; the admin's
  delete at `/admin/scores` is the backstop. The last `next` answers the device's **standing**
  (rank among players, its best, its best before), which the result screen shows. Full
  description: `game-architecture.md` § The global board
- **Restart:** "Play Again" starts a new game directly, in the same mode; "Main Menu" returns to welcome screen
