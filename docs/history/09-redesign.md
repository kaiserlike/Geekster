<!-- Archived verbatim from SPRINTS.md on 2026-10-04. It describes the project as it was then;
     CLAUDE.md and docs/ describe the present. See docs/history/README.md for the naming. -->

## Sprint 9 - Redesign: Design System, Styleguide & New Look

> Goal: Geekster looks and feels like its own product. Every screen after this one is built from
> the design system, not restyled later

Placed straight after Sprint 8 on purpose (decision 2026-09-26): Sprint 8 adds little new UI, while
Sprints 10 and 11 add the three biggest new surfaces. **Planned in detail on 2026-09-27, at sprint
start, and it runs before Sprint 8m** (decision 1 below).

### Start here (for the implementation session)

**State on 2026-09-28: 9a is done and approved. 9b is done on `develop` and verified on staging
(see "9b — what was built"); it is not released on its own (decision 9 below), so production
still runs Sprint 8. 9c, 9d and 9e are done on `develop` (see "9c — what was built", "9d — what
was built", "9e — what was built" and "9f — what was built"). 9g is done on `develop`
too (see "9g — what was built"); what is left is the one release PR.
No slice is released on its own: the whole of Sprint 9 goes to production in one release after
the last slice (decision 10, "Branching").**

1. Read this section to the end: the decisions, the audit, the HUD spec, 9a's "Design calls",
   the token table, **"9b — what was built"**, **"9c — what was built"**, **"9d — what was
   built"** and **"9e — what was built"** (what exists now). Then
   `CLAUDE.md` § Game Logic and § Conventions (tokens and primitives only, transitions from
   `$lib/motion`), then the file you are about to touch. The "Delivery order" table says what each
   slice asks first. 9c and 9d ask nothing: everything they need is decided
2. **The design lives on a Claude Design canvas:**
   <https://claude.ai/artifact/7Ay9wtudti5RL6CHx9W1v1>, page **"M3 · Full design"** (the
   "Exploration" page is the history of how M3 was chosen). It's private to the owner. Read it
   with the Artifact tool's `read` action and a `path` (`project/canvas.json` lists the boards;
   each board is `project/M3<Name>.dc.html`), never with WebFetch. Its markup is a mock-up, not
   code to copy: the values are in the token table here, and the structure is in the design calls
3. **From 9b on, the code is the source of truth**: `src/app.css` `@theme` plus `/styleguide`.
   The canvas is the reference it was built from, and nobody keeps it in sync after 9b. If an
   implementation choice differs from a board, correct this section, not the canvas
4. `scratchpad/sprint9-design/` (gitignored, this laptop only) holds a local copy of the boards.
   It may be older than the canvas, because the user can edit boards in the canvas editor.
   **The canvas wins**
5. **Every slice is committed on `develop`** and pushed, so staging shows it. **Nothing is merged
   into `main` until Sprint 9 is complete** (decision 10, "Branching")
6. **What already exists for 9c–9e to build with** (9b): the tokens in `src/app.css`; the
   primitives in `src/lib/components/ui/` (`Button`, `IconButton`, `Chip` incl. the `multiplier`
   and `mystery` tones, `Surface` incl. the `magenta` HUD frame, `TextField`, `SegmentedControl`,
   `Toast` with its live region (deleted in 9f, unused since 9d), `Wordmark`, `IconMark`, `HorizonGrid`, `icons/Heart` full / empty
   / socket, `icons/CreditCoin`); `$lib/motion` (`DURATION`, `EASE`, `fade`/`fly`/`slide`/`scale`);
   `AppHeader` in the root layout. **Added by 9c:** `icons/Heart` `broken`; `Surface` frames
   `danger-glow` / `life-glow`; `RunHud` (with `compact`) and `StreakMeter`; `AppHeader`'s `score`
   prop (the header collapse); `FeedbackToast`; `CurrentCard`, `Timeline` / `TimelineRow`; the
   `DragPlace` class in `src/lib/dragPlace.svelte.ts` (one instance, made in `GameScreen`);
   `streakMeter()` and `hudMoment()` in `placement.ts`; `formatNumber()` / `formatMultiplier()`
   in `i18n.svelte.ts`; `countUpDuration()` in `$lib/motion`. **Added by 9d:** the year-first
   `TimelineRow` (statuses settled / hidden / placed / misplaced, `compact`), `TimelineSlot`
   with its accessible name, `DecadeRuler`, the answer card in `ScoreReveal`, the M3
   `BonusGuessPanel`; `decadeBuckets()` and `ghostSlotIndex()` in `placement.ts`;
   `headerScore`; `Button`'s bindable `ref`; the desktop `100dvh` shell in `+layout.svelte`
   while playing. **9e can reuse `TimelineRow compact` for the result screen's timeline** (with a
   miss marked `misplaced`) and then delete `GameCard`. `/styleguide` shows all of it.
   **Use these, and extend them there rather than restyling inline.** A new primitive gets its
   own section on `/styleguide` in the same commit
7. **Playing a run locally** needs `local.db` with games (`npm run db:migrate && npm run db:seed`
   if it's missing; it exists on this laptop). Don't edit repo files while a scripted run is going
   against `npm run dev`: the HMR reload drops the page back to the welcome screen. The memory note
   on driving headless Brave over CDP covers clicking through a run. **The 9c drivers are in
   `scratchpad/cdp/`** (gitignored, this laptop only; its README has the usage): `run.mjs`
   plays a scripted R/W run with screenshots, animation logs and frame bursts, plus touch,
   HTML5-drag, count-up, styleguide and preview checks. **For Pro locally:**
   `local.db` on this laptop has 40 Pro primaries (copied from Normal shots in 9c, local only),
   and the gate needs `PRO_MIN_POOL_OVERRIDE=5 npm run dev` (set in the shell, not in `.env`)
8. **The boards for 9e:** `M3Welcome` (first visit), `M3Returning` (returning, in German, with
   the leaderboard tabs), `M3DeskWelcome` (desktop), `M3Result` (game over, long run),
   `M3Perfect` (perfect run, the striped sun), plus `M3States` (mode choice, result headlines,
   leaderboard empty / loading, the welcome error box). 9d used `M3Play`, `M3Drag`, `M3Bonus`,
   `M3RevealOk`, `M3RevealWrong`, `M3DeskPlay`, `M3DeskLong` and `M3States`

### Where Sprint 9 starts (audited 2026-09-27)

- **Favicon:** `src/lib/assets/favicon.svg` is SvelteKit's default Svelte logo
- **Link previews:** none. There's no meta description, no `og:*` or `twitter:*` tags, no
  `apple-touch-icon` and no web manifest. `<title>` is "Geekster" on every screen. A link sent in
  WhatsApp shows the bare URL
- **`<html lang="en">`** is fixed in `src/app.html`. It never changes, even when German is on.
  (Found in 9b: the server actually renders **German**, since `loadLocale()` defaults to `de` when
  there is no localStorage, so `en` was wrong for the server's HTML too)
- **No tokens.** `src/app.css` holds one keyframe (`heart-pop`). Colours are raw Tailwind palette
  classes (`purple-600`, `gray-900`, `green-400` …) spread across ten components. Buttons differ
  per screen in radius, size and colour
- **`GameScreen.svelte` is 563 lines**: HUD, feedback banner, current card, drag and drop
  (HTML5 and touch), bonus panel host, reveal and timeline in one file. The code-style rule is
  ~200 lines of logic per component
- **Motion:** Svelte `fly`/`fade`/`slide` everywhere. Only the heart pop honours
  `prefers-reduced-motion`
- **Staging is behind Vercel Authentication**, so a link-preview crawler (WhatsApp, Discord,
  Signal …) gets a 302 there. On staging the meta tags can only be checked by reading the HTML
  (with an access link from `get_access_to_vercel_url`). The real preview can only be checked on
  production

### Decisions made while planning (asked, not assumed — 2026-09-27)

| #   | Question                     | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sprint 9 before 8m?          | **Yes.** Sprint 9 needs no migration. 8m earns its keep when Sprint 10 adds tables, so it moves to just before Sprint 10                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2   | Design tool                  | **Claude Design** (a claude.ai Design canvas) for the directions and the full screen set. No Figma. The code is the source of truth from 9b                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3   | Visual direction             | **Open.** The user wanted to see all four first. They're drafted on the canvas (main game screen, phone): A retro arcade/CRT, B modern console UI, C collectible cards (light), D synthwave neon. A mix is allowed. **Shortlist (2026-09-27): D first, A second**, but the user isn't a fan of purple. So four D variants were added: D2 turquoise synthwave, D3 cyberpunk (yellow/cyan/red, angular), D4 neo-machi (neon night city, katakana signage) and D5 neon arcade '87 (A × D, San Junipero). The user's keywords: retro-futuristic, neon 80s, Cyberpunk 2077, Black Mirror. The final pick is the first question of 9a |
| 4   | "Rupees" and the Zelda rupee | **Replaced by Geekster's own score currency: Credits (CR)**, a gold coin (chosen at 9a's start). Hearts stay (generic)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 5   | The energy bar               | **The bar is the streak** (spec below). One streak display with the multiplier. A heart socket at the bar's end appears only while a life is missing                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 6   | Sound                        | **Not in Sprint 9.** It stays Idea 5 in `ROADMAP.md`. The existing `navigator.vibrate(30)` on a touch-drag start stays. No new haptics                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 7   | Link previews                | **Static:** favicon set, apple-touch-icon, web manifest, one 1200×630 OG image, title and description, plus a **share-card template** designed for Sprint 10's per-result image. No server-rendered image yet                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 8   | Legal pages                  | **Last slice of Sprint 9 (9g)**, in the new look. The user supplies the Impressum details at its start. Nothing personal goes into the repo before then                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 9   | Release 9b on its own?       | **No** (2026-09-28). 9b stays on `develop`, unreleased, and ships with the redesign                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 10  | Where do 9c–9g go?           | **`develop`, and staging, slice by slice** (2026-09-28). No feature branch: staging may show a half-new game. **`main` gets nothing until Sprint 9 is complete**; then one release PR carries 9b–9g to production. `feature/redesign` (used for 9c) was merged into `develop` and deleted                                                                                                                                                                                                                                                                                                                                       |
| 11  | Desktop layout of a run?     | **One column on every screen** (2026-09-28, after trying two): the phone's model, larger, within 880 px, with a pinned bar (compact HUD + card strip) once the card scrolls off and a decade ruler beside the column from 1280 px. Supersedes 9a's two-column and fixed-shell design calls. No layout switch mid-run                                                                                                                                                                                                                                                                                                            |

### UX audit (2026-09-27)

Every screen and state in the code, checked against Nielsen's ten heuristics, WCAG 2.2 AA and
mobile game conventions. The last column says which slice fixes it.

| #   | Where        | Finding                                                                                                                                                                                                       | Heuristic                              | Slice   |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------- |
| U1  | HUD          | The green bar means two things: progress to a life, then (lives full) a dimmed bar that still fills and is labelled "lives full". Same control, different meaning by state                                    | Consistency; match with the real world | 9c      |
| U2  | HUD          | The streak is shown twice: the bar, and an orange "7x streak" text that appears only from streak 2 and pushes the HUD row sideways (layout shift)                                                             | Consistency; minimalist design         | 9c      |
| U3  | HUD          | The streak's actual reward, the ×1.0–1.5 score multiplier, isn't visible until the score breakdown                                                                                                            | Visibility of system status            | 9c      |
| U4  | HUD          | The labels are 10 px, in `green-500/80`, `red-500/80` and `gray-400`. That's below a readable size, and the contrast was never checked                                                                        | WCAG 1.4.3 / 1.4.4                     | 9b + 9c |
| U5  | HUD          | "Rupees" and a Zelda rupee icon: a borrowed trademark in a public brand                                                                                                                                       | —                                      | 9c      |
| U6  | HUD          | "PLACED" repeats what the timeline already shows and is one more number to parse                                                                                                                              | Minimalist design                      | 9c      |
| U7  | Feedback     | The banner is fixed at the top and covers the HUD for 5 s. It's not in a live region, so a screen reader never hears "Correct!"                                                                               | Visibility; WCAG 4.1.3                 | 9c      |
| U8  | Wrong        | The card is auto-inserted where it belongs, but nothing shows where you put it compared with where it goes, which is the moment a player learns something                                                     | Help users recognise errors            | 9d      |
| U9  | Current card | Sticky and full width at 16:9, it takes ~45 % of a 390×844 screen. While dragging, little of the timeline is visible                                                                                          | Flexibility; Fitts                     | 9d      |
| U10 | Timeline     | The screenshot dominates a row, while the year, the only thing a placement decision needs, is small and right-aligned                                                                                         | Recognition rather than recall         | 9d      |
| U11 | Placing      | "Place in the timeline" doesn't say that tapping a slot works. Players who don't find the 250 ms long-press think the game is broken                                                                          | Visibility; affordance                 | 9d      |
| U12 | Bonus        | Autofocus on the year field opens the phone keyboard over the screen as the 30 s timer starts. `type="number"` changes its value on a scroll-wheel turn. The placeholders ("e.g. 2004") are English in German | Error prevention; i18n                 | 9d      |
| U13 | Bonus        | The timer warns only with a colour change at ≤ 5 s, and nothing is announced                                                                                                                                  | WCAG 1.4.1 / 2.2.1                     | 9d      |
| U14 | Welcome      | Six numbered rules stand between the title and the Play button. They're read once and forgotten by the time they matter                                                                                       | Minimalist design; recognition         | 9e      |
| U15 | Result       | After a long run, Play Again and Main Menu sit below the leaderboard and the entire timeline (50+ rows). The primary action is buried                                                                         | Visibility; Fitts                      | 9e      |
| U16 | Result       | The final timeline doesn't mark which cards were misplaced (`roundScores[i].base === 0`), which is the most useful thing to learn from                                                                        | Help users recognise errors            | 9e      |
| U17 | Global       | There's no consistent `focus-visible` ring. Every screen draws its own buttons                                                                                                                                | Consistency; WCAG 2.4.7                | 9b      |
| U18 | Global       | Only the heart pop honours `prefers-reduced-motion`                                                                                                                                                           | WCAG 2.3.3                             | 9b–9e   |
| U19 | Global       | `<html lang>` stays `en` in German, so a screen reader reads German with English rules                                                                                                                        | WCAG 3.1.1                             | 9b      |
| U20 | Global       | There's no app header. The language switch floats `absolute` over the content, and each screen draws its own title                                                                                            | Consistency                            | 9b      |
| U21 | Global       | The RAWG credit is 10 px `gray-700` on `gray-950` (~1.9:1). It's a credit we owe and nobody can read it                                                                                                       | WCAG 1.4.3                             | 9g      |
| U22 | Sharing      | There's no link preview, and the favicon is Svelte's                                                                                                                                                          | —                                      | 9b      |

### The HUD: the bar is the streak (decision 5)

The rules it must show: the multiplier is `getStreakMultiplier()` in `scoring.ts`, ×1.0 at
streak 1, +0.1 per game and capped at ×1.5 from streak 6. `regainsLife()` in `placement.ts` gives a
life back at every multiple of `LIFE_REGAIN_STREAK` (10) while lives < 3. The drawn states are on
the canvas's "Streak bar: the four states" board.

- **One pure function, unit-tested:** `streakMeter(streak, lives, maxLives)` in `placement.ts`,
  returning
  `{ filled, multiplier, socket, toNextLife }`:
  - `filled` (0–10): `streak === 0 ? 0 : ((streak - 1) % 10) + 1`. So 7 → 7, 10 → 10 (a full
    bar, the moment the life comes back), 11 → 1 and 20 → 10
  - `multiplier` is the multiplier **the next correct placement will earn**:
    `getStreakMultiplier(streak + 1)`. `game.svelte.ts` scores a round with the streak _after_ the
    placement, so this is the number the player is playing for. At 0 it reads ×1.0, at 1 ×1.1
    and from 5 ×1.5
  - `socket`: `lives < maxLives`. The heart socket at the bar's end exists only then
  - `toNextLife`: `10 - (streak % 10)` while a life is missing, else `null`
- **The component** (`StreakMeter.svelte`): the label "Streak N", a ×multiplier chip, 10
  segments (`role="progressbar"`, `aria-valuenow={filled}`, `aria-valuemax=10`, and an
  `aria-label` that says the whole state in words), the socket when there is one, and a caption:
  "N more in a row for +1 life" with a socket, and the multiplier status without. **The separate
  "Nx streak" text and the dimmed "lives full" state are removed**, and so are the
  `hud.livesFull` / `hud.streak` strings that no longer have a use
- **Streak hits 10 with a life missing:** the bar fills and flashes, the socket fills, a heart
  travels from the socket to the empty life, and the segments empty for the next lap. With
  reduced motion it's a crossfade. The toast says "+1 life". **Streak hits 10 with lives full:**
  the bar flashes and there's a short "10 in a row!", no life
- **Wrong placement:** a heart breaks, the bar drains right to left (~400 ms) and the chip drops to
  ×1.0 and turns neutral. The loss shows where the gain was
- The HUD row is **fixed-width**. Nothing appears or disappears in it between states, so there's
  no layout shift (U2)

### Branching: every slice on `develop`, one release at the end (decision 10)

The user wants **the complete redesign as one update to production**, and staging is where the
slices are looked at in between. So, from 2026-09-28:

- **Every slice (9c–9g) is committed on `develop` and pushed**: staging.geekster.pro shows it a
  few minutes later. Staging may show a half-new game (a new HUD over an old welcome screen); that
  is expected and fine. Test a slice on staging before calling it done
- **Nothing is merged into `main` until Sprint 9 is complete**, i.e. after 9g. Then one release
  PR `develop` → `main` carries 9b–9g, followed by the production checks (the link previews in
  the messengers, see 9b's "Verify"). No migration is involved anywhere in Sprint 9
- **No `feature/redesign`.** 9c was built on one (the old plan, to keep `develop` releasable);
  it was fast-forwarded into `develop` on 2026-09-28 and deleted. Don't recreate it
- **Consequence: `develop` is not releasable until Sprint 9 is done.** A fix production can't
  wait for goes `hotfix/*` off `main` → PR → `main`, then `git merge origin/main` into `develop`
  (`CLAUDE.md` § Deployment & CI). Never release `develop` early to ship a fix
- Before each push: `npm run lint && npm run check && npm run test && npm run build` (CI on
  `develop` runs after the push, so a red run means staging is already broken)

### Delivery order

Seven slices, **one session each** (9d is the largest: if it runs long, split the bonus panel and
reveal off into their own session). Not one session for the sprint: each slice ends verified, and
a session that holds the whole redesign in context does none of it well. 9a is design only and
may take two short rounds with the user between them. If a slice finds this plan wrong, it
corrects this section in the same commit.

| Slice                    | Content                                                                                                     | Branch    | Release                | Stories       | Ask at its start                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | --------- | ---------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| **9a** ✅ done, approved | Direction chosen, then every screen and state designed on the canvas; tokens, logo, icons, OG, share card   | —         | none (design only)     | 9.1           | direction (or mix), currency name, logo form, desktop layout, one theme or two               |
| **9b** ✅ done           | Foundation: tokens, self-hosted fonts, UI primitives, app header, `/styleguide`, favicon set, link previews | `develop` | with 9g (decision 10)  | 9.1, 9.3, 9.4 | —                                                                                            |
| **9c** ✅ done           | `GameScreen` split up (no visual change), then the HUD, the streak bar, currency, toast                     | `develop` | with 9g                | 9.2, 9.3      | —                                                                                            |
| **9d** ✅ done           | Playing screen: current card, timeline rows, slots, drag, wrong-placement feedback, bonus panel, reveal     | `develop` | with 9g                | 9.2, 9.3      | —                                                                                            |
| **9e** ✅ done           | Welcome, mode choice, result, leaderboard, loading and error states                                         | `develop` | with 9g                | 9.2, 9.3      | first-run hint: **coach mark** (decided 2026-09-28)                                          |
| **9f** ✅ done           | Quality pass (Lighthouse, axe, keyboard, screen reader, reduced motion, CLS); admin gets the tokens         | `develop` | with 9g                | 9.3           | —                                                                                            |
| **9g** ✅ done           | Legal: Impressum, privacy, takedown contact, screenshot credit, footer                                      | `develop` | **one release, 9b–9g** | —             | operator's details, which country's rules (AT/DE), per-screenshot credit now or in Sprint 11 |

9g is last because the user chose it (decision 8). It depends only on 9b (tokens, Button, the
footer), so it can move earlier if the user wants; it still goes out with the one release

### User Stories

- [ ] US-9.1: As a player, Geekster has a distinct visual identity (logo, colour, type, motion)
      that makes it recognisable in a shared link or a screenshot
- [ ] US-9.2: As a player, every screen works as well on a phone as on a desktop, and feedback on
      a placement feels satisfying (motion; sound is deferred, decision 6)
- [ ] US-9.3: As a player with a disability, contrast, focus states and reduced motion are
      respected (WCAG 2.2 AA)
- [ ] US-9.4: As the developer, a living styleguide shows every component in every state, built
      from the real components so it cannot drift
- [x] US-9.5: As a player, the streak display tells me at a glance how long my streak is, what it
      multiplies my points by, and how far away the next life is, if I'm missing one
- [ ] US-9.6: As a player sharing a link, the messenger shows Geekster's name, a one-line pitch and
      a preview image

### Tech Tasks

#### 9a — Direction and full design (no code)

- [x] Four directions drafted on the canvas as the main game screen, phone, mid-run: lives 2/3,
      streak 7, a card to place, a year-first timeline (2026-09-27)
- [x] The streak bar's four states drawn direction-neutral: life missing, lives full, streak hits
      10, wrong placement
- [x] First round: D (synthwave) preferred, A second, less purple wanted. Variants D2–D5 drawn
      (2026-09-27)
- [x] Second round: **D2 preferred**, D4 close behind. Two mixes drawn (2026-09-27): M1 "neon
      sign" (D2 + D4's glowing heading + D4's pink HUD border + D3's `// TIMELINE PROTOCOL`
      tagline) and M2 "glitch" (the same, with D3's hard RGB-split heading echoed on the card frame)
- [x] **Direction chosen and confirmed (2026-09-27): M3**, the canvas board "M3 · M2 refined". It's M2 (D2's
      turquoise synthwave base, Dela Gothic One heading with a pink/turquoise RGB split, D4's pink
      HUD border) with:
  - the tagline `// TIMELINE PROTOCOL v9` in pink (`#ff7ae6`), as in M1
  - a light glow on the heading on top of the split
  - on the card to place, M1's turquoise frame with a **pink** glow (`#ff2bd6`), the same pink as the HUD border
  - **the horizon grid calmed** (the user's concern: its lines looked like strikethroughs through
    "Place here" and cut its contrast): opacity 0.3 (0.16 was too faint, the user's feedback), a 0.5 px blur, masked to fade
    out over the top third. Slots and rows sit on opaque surfaces, so no line ever runs behind text. **Rule for 9b:
    decoration never shows through text; every text-bearing surface is opaque**
- [x] The user confirmed M3 as final (2026-09-27)
- [x] **Answers at the start of the full design (2026-09-27):** currency **Credits (CR)**; logo =
      **wordmark + a separate icon mark**; desktop ≥ 1024 px = **two columns**; **dark only**
- [x] **The full design, on the canvas page "M3 · Full design"** (2026-09-27), 17 boards:
  - phone: welcome (first visit; returning, in German), playing idle, dragging, bonus guess with
    the keyboard open, reveal correct, reveal wrong, streak 10 / life back, result (game over,
    long run), result (perfect run)
  - desktop 1280: playing (two columns), welcome
  - tokens; components and states (buttons, chips, the Pro header, slots, toasts, mode choice,
    timer, result headlines, leaderboard empty/loading, the error box)
  - brand (wordmark, icon mark at 512/180/32/16, the credit coin); the OG image; the share-card
    template with `{SCORE}`, `{MODE}` … slots for Sprint 10
- [x] Every text/background pair measured (below). Two fixes came out of it: control borders use
      `line-strong` (the M3 draft's `#1b5a66` was 2.5:1, under the 3:1 a control boundary needs),
      and text on magenta is always dark (white on `#ff2bd6` is 3.2:1)
- [x] The user reviewed the full-design page and approved it ("I love it", 2026-09-27), with one
      addition: a long timeline on desktop must keep the overview (next bullet)
- [x] **Long timeline on desktop** drawn as the board "Desktop · long timeline, mid-drag: fixed
      shell, decade ruler" (2026-09-27). See the design call below

##### Design calls the boards make (the implementation follows them)

- **The HUD compacts to one line while dragging** (hearts, bar, chip, score) and **collapses into
  the header while the bonus keyboard is open** (the score moves next to the wordmark). A phone
  keyboard leaves ~550 px, and the bonus panel has to fit in it with its buttons
- **Toasts sit in the flow under the HUD** (superseded in 9d's review: they float top left), never over it (U7): correct turquoise ✓, wrong red ✗,
  life pink ♥, "10 in a row" with lives full turquoise ★
- **Wrong placement:** the HUD border turns red for the moment and the broken heart shows. The
  timeline shows a red dashed "You put it here" ghost where the card was dropped and the card in
  its right place with a red frame, "Belongs here", then "Next card". No bonus round
- **Life back:** the whole bar flashes white-turquoise, a dotted pink arc runs from the bar's end
  to the heart that returns (reduced motion: the heart fades in), and the HUD border glows pink
- **Result:** the headline, then the score and "new personal best" when it is one, then 4 stats,
  then **Play again / Menu directly under them**. Because they sit above the fold, the sticky
  bottom bar from the 9e task is **not needed**. Then the leaderboard (this device / global), then
  "Your timeline · N" as compact rows with misses framed red and marked ✗. Headline colours:
  Game over red glow, Pool cleared turquoise, Perfect run gold (with a striped synthwave sun)
- **Pro's mode colour is pink:** the selected Pro segment, the `PRO` chip, and the badge beside the
  wordmark during a Pro run. Normal is turquoise
- **Welcome:** the wordmark large, the pitch in two sentences, the mode choice, one 56 px START
  RUN, "How to play ▸" as a text button. The rules are gone from the first screen (U14). A
  returning player gets "Welcome back, your best: N CR" and the leaderboard tabs (this device /
  global / classic when it exists)
- **Desktop playing:** left column 440 px (HUD, the card to place, a hint with the keyboard path
  Tab → Enter), right column the timeline up to 680 px with 128 × 72 thumbnails. The page scrolls
  the right column only; the left one is sticky
- **Year chip on the card to place:** always `????`, in the display face with the RGB split
- **Superseded by decision 11 (2026-09-28): one column on every screen, see "9d — what was
  built".** The next call and "Desktop playing" above describe the design as drawn
- **Desktop with a long timeline (the user's point, 2026-09-27): the page never scrolls.** From
  1024 px the app is a fixed shell of `100dvh`: the header and the left column (HUD, the card to
  place, the hint) never move, and **only the timeline pane scrolls** (its own
  `overflow-y: auto`). That is more robust than a `position: sticky` column: nothing jumps, and
  the card and the lives are always in the same place. On top of it:
  - **A decade ruler** beside the pane (72 px wide): one button per decade the timeline holds
    (80s · 90s · 00s · 10s · 20s), its height proportional to its card count (at least 44 px),
    the count on it, and the decade in view highlighted (`aria-current`). A click scrolls the
    pane to that decade. **While dragging, hovering a decade scrolls there**
  - **Pinned decade labels:** each decade starts with a label ("2000s", pink) that sticks to the
    top of the pane while that decade is in view, with the count "Your timeline · 34" next to it
  - **Auto-scroll while dragging:** a 64 px zone at the pane's top and bottom edges. The pane
    scrolls while the dragged card is in it, faster the deeper in, with a turquoise edge and
    "▼ SCROLLING" as the cue. Touch already has this for the whole page; desktop gets it for the
    pane
  - **The pane never scrolls towards an answer.** It keeps its position between cards and never
    jumps to the card's decade or to the last placement: that would give the year away. It moves
    only for the reveal: the placed card scrolls into view there, and for a wrong placement so do
    its ghost and its right place
  - Past `COMPACT_TIMELINE_AT` the rows are the compact 40 px ones (year + name) and the slots
    36 px. On desktop both are pointer targets, so 36 px is fine against WCAG 2.5.8's 24 px
  - **Phones** keep the page scroll and the shrinking card strip. Whether a narrow decade ruler
    fits on a phone's right edge is tried in 9d and decided there
- **The slot copy is "+ PLACE HERE"**, "▼ DROP HERE ▼" on the drop target, whose height grows to
  60 px while dragging

##### Tokens (9b's input: copy these into `@theme`, the canvas holds nothing more)

Contrast is against `bg` unless another surface is named. Fonts: **Dela Gothic One** (display:
wordmark, headlines, `????`), **Chakra Petch** 500/700 (UI: labels, buttons, years, every number,
tabular), **Exo 2** 400/500/600 (body). All OFL, self-hosted.

| Token            | Value     | Use                                                        | Contrast          |
| ---------------- | --------- | ---------------------------------------------------------- | ----------------- |
| `bg`             | `#03101a` | page ground                                                | —                 |
| `surface`        | `#061824` | HUD, bonus panel, leaderboard                              | —                 |
| `surface-raised` | `#06202c` | timeline rows, icon buttons                                | —                 |
| `surface-sunken` | `#04151f` | slots, secondary buttons                                   | —                 |
| `accent-soft`    | `#0a3a40` | selected tab, drop target, correct toast                   | —                 |
| `line`           | `#16444f` | dividers only                                              | 2.2               |
| `line-strong`    | `#2a8a93` | every control border, slot dashes                          | 4.4 on surface    |
| `ink`            | `#e8fbff` | text                                                       | 18.0              |
| `ink-muted`      | `#9cc9d1` | secondary text                                             | 10.7 (10.0 surf.) |
| `ink-subtle`     | `#6f98a1` | disabled                                                   | 6.1               |
| `accent`         | `#3ff0e4` | primary buttons, streak bar, Normal                        | 13.5              |
| `accent-strong`  | `#5ff5e8` | years, "STREAK N"                                          | 14.4              |
| `on-accent`      | `#03101a` | text on accent, pink and magenta                           | 13.5 / 8.4 / 6.0  |
| `focus`          | `#f2fffe` | 2 px ring outside a 2 px `bg` gap                          | 18.8              |
| `magenta`        | `#ff2bd6` | HUD border, card glow, RGB split — borders and glow only   | 6.0 (5.6 surf.)   |
| `pink`           | `#ff7ae6` | tagline, section labels, `PRO`, `NEW`, `COMING SOON`       | 8.4               |
| `life`           | `#ff3d9a` | hearts                                                     | 5.8               |
| `life-empty`     | `#7a6a96` | a lost heart's outline                                     | 3.7 on surface    |
| `danger`         | `#ff4d6d` | wrong placement, misses, timer ≤ 5 s, always with ✗        | 6.0               |
| `danger-soft`    | `#1f0c16` | wrong fills                                                | —                 |
| `score`          | `#ffd98a` | credits (coin `#ffc857`, rim `#8a5a00`) — gold means CR    | 14.2              |
| `grid`           | `#1de9d6` | the horizon grid, opacity 0.3, blur 0.5 px, top-third fade | decoration        |

| Group   | Values                                                                                                                                                                                                                                                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type    | display 24/32/38 (headlines), 27/44/68 (wordmark); UI 11–13 caps +1.5 px, 15–17 buttons, 22/26 years; body 13/15/17, lh 1.5. Min 12 px; the 10 px tagline is decoration                                                                                                                                                    |
| Space   | 4 · 8 · 12 · 16 · 24 · 32 · 48; page gutter 16 (phone), 40 (desktop)                                                                                                                                                                                                                                                       |
| Radius  | 4 chips · 6 thumbnails, tabs · 8 buttons, panels · 10 cards, rows                                                                                                                                                                                                                                                          |
| Effects | glow-accent `0 0 16px rgb(63 240 228 / .45)`; glow-magenta `0 0 12px rgb(255 43 214 / .3)`; glow-card `0 0 22px rgb(255 43 214 / .5), 0 0 6px rgb(255 43 214 / .4)`; rgb-split `-2.5px 0 magenta, 2.5px 0 accent` (+ `0 0 9px accent/.5` on the wordmark), only on the wordmark, headlines, `????` and the multiplier chip |
| Motion  | fast 120 ms · base 200 · slow 400 · reveal 900; ease-out `cubic-bezier(.2,.8,.2,1)`, in-out `(.65,0,.35,1)`, overshoot `(.34,1.56,.64,1)`; reduced = opacity only, ≤ 120 ms, the score jumps                                                                                                                               |
| Targets | ≥ 44 px, primary actions 52–56 px                                                                                                                                                                                                                                                                                          |

#### 9b — Foundation

**Scope:** everything the later slices build on, and nothing they own. The game screens are not
restyled here: they keep their look, except that `body` takes the tokens' ground and ink, and the
app header replaces the floating language switch. So a 9b release changes little on screen; what
players notice is the favicon and the link preview. **Done when** every box below is ticked,
`/styleguide` renders every primitive in every state at 390 and 1280 px, staging serves the head
tags, and the release PR `develop` → `main` is merged (no migration). Then sync `develop` as in
`CLAUDE.md` § Deployment & CI, step 4, and cut `feature/redesign` off `develop` for 9c.
**Superseded by decisions 9 and 10:** 9b is done without the release, and there is no
`feature/redesign`; the release PR and the production link-preview checks move to the one
Sprint 9 release after 9g.

- [x] **Tokens in `@theme`** in `src/app.css`, exactly the names and values of 9a's token table,
      prefixed by kind: `--color-bg`, `--color-surface`, `--color-surface-raised`,
      `--color-surface-sunken`, `--color-accent-soft`, `--color-line`, `--color-line-strong`,
      `--color-ink`, `--color-ink-muted`, `--color-ink-subtle`, `--color-accent`,
      `--color-accent-strong`, `--color-on-accent`, `--color-focus`, `--color-magenta`,
      `--color-pink`, `--color-life`, `--color-life-empty`, `--color-danger`,
      `--color-danger-soft`, `--color-score`, `--color-coin`, `--color-grid`; `--font-display`
      (Dela Gothic One), `--font-ui` (Chakra Petch), `--font-body` (Exo 2); `--radius-*`;
      `--shadow-glow-accent`, `--shadow-glow-magenta`, `--shadow-glow-card`; `--text-shadow-split`;
      `--ease-out`, `--ease-in-out`, `--ease-overshoot`; the four durations. Tailwind v4 turns
      them into utilities (`bg-surface`, `text-ink-muted`, `font-display`, `shadow-glow-card`).
      **Don't reset Tailwind's default palette** (`--color-*: initial`): the admin panel still uses
      `gray-*` and gets the tokens only in 9f. `heart-pop` stays. `body` gets `bg-bg text-ink
font-body`, which replaces `bg-gray-950 text-white` in `+layout.svelte`
- [x] **Fonts self-hosted** through the three `@fontsource` packages (decided; see "Start here",
      step 6), latin subset only, the weights in the token table and no others,
      `font-display: swap`, and a `<link rel="preload">` for the Dela Gothic One woff2 (import it
      with `?url`). **Never from Google's CDN:** the
      Munich Regional Court fined a site in 2022 for passing visitors' IP addresses to Google
      through embedded Google Fonts (LG München I, 3 O 17493/20). The privacy page (9g) can then
      say that no third party receives anything from a page view
- [x] **UI primitives** in `src/lib/components/ui/`: `Button` (primary / secondary / ghost, sizes,
      loading, disabled), `IconButton` (`aria-label` required by its props type), `Chip`,
      `Surface`, `TextField`, `SegmentedControl` (what `ModeChoice` becomes), `Toast` with a
      polite `aria-live` region, and the icon set (heart full/empty/socket, the currency).
      Touch targets ≥ 44 px, and one `focus-visible` ring from `--color-focus`
- [x] **Motion:** `src/lib/motion.ts` with the durations and easings, plus a wrapper for Svelte
      transitions that sets the duration to 0 when `prefersReducedMotion.current`
      (`svelte/motion`, available in the installed Svelte 5.51) is true. Every later slice uses it
      instead of raw `fly`/`fade`
- [x] **App header** (`AppHeader.svelte`): wordmark, the Pro badge while a Pro run is on, the
      language switch. It replaces the absolutely positioned `LangSwitch` in `+layout.svelte`
- [x] **`<html lang>` follows the language**: set `document.documentElement.lang` on switch and
      on load. The server renders `en`, because the language lives in `localStorage` and the
      server can't know it
- [x] **`/styleguide`**: a route rendering every primitive in every state, built from the real
      components. It has `<meta name="robots" content="noindex">` (the hook's `X-Robots-Tag`
      covers only non-production), isn't linked anywhere, and is listed in the structure docs.
      Decided here: this route is the living styleguide (the old 9c's "decide in 9a")
- [x] **Brand assets, rendered from the real fonts:** the icon mark (the "G" with the RGB split
      on its dark square with a magenta edge; the horizon grid only from 180 px up) and the OG
      image are built as Svelte pages under `/styleguide/brand/*` (one per asset, the exact pixel
      size, no chrome), from the canvas boards "Brand" and "OG image". A committed script
      `scripts/render-brand-assets.cjs` (`npm run brand:render`) starts headless Brave against
      the dev server, screenshots each page over CDP (the approach used to verify Sprint 8; `ws`
      is already in `node_modules`), compresses with `sharp` (already a devDependency) and writes
      `static/`: `favicon-16.png`, `favicon-32.png`, `favicon.ico` (a PNG-in-ICO container of
      16 + 32, a few lines of header code, no new dependency), `apple-touch-icon.png` (180,
      opaque), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (the G inside the centre
      80 %) and `og-image.png` (1200×630, under 300 kB). **No SVG favicon:** it would need the G as
      an outlined path, since a favicon can't load a web font, and PNG + ICO cover every browser.
      The generated files are committed. The script runs on a laptop only, when the brand changes,
      never in CI, and its usage goes in its header comment and the README command table.
      Delete `src/lib/assets/favicon.svg` (the Svelte logo) and its import in `+layout.svelte`
- [x] **`site.webmanifest`**: `name`, `short_name`, icons, `theme_color`, `background_color`.
      `display` stays `browser`: making Geekster installable is Idea 6, not this sprint
- [x] **Link previews** in `+layout.svelte`'s `<svelte:head>`: `<meta name="description">`,
      `og:title`, `og:description`, `og:type=website`, `og:url`, `og:site_name`, `og:locale=en_US` + `og:locale:alternate=de_DE`, `og:image` (**absolute**, `${page.url.origin}/og-image.png`),
      `og:image:width/height/alt`, `twitter:card=summary_large_image` and `theme-color`. The text
      is English, because crawlers get the server-rendered default language. The image is a PNG
      or JPEG under 300 kB, not WebP: WhatsApp drops larger images and some clients still ignore
      WebP. The admin pages get none of it
- [ ] **Verify:** `curl` the HTML on staging (with an access link) for every tag. After the
      production release, send the link in WhatsApp, Signal, iMessage, Telegram and Discord, and
      check opengraph.xyz. Messengers cache a preview per URL, so test with `?v=2` after a change
- [x] Docs: `CLAUDE.md` (structure, `ui/`, `/styleguide`, the static assets), README,
      `.claude/docs/project-structure.md`

##### 9b — what was built, and where it differs from the plan above (2026-09-27)

Everything above is in the code; these are the calls made while building it. The plan's text is
left as written, so read this list as the correction.

- **`<html lang>` is rendered `de`, not `en`.** The plan said the server renders `en`, but the
  server's HTML is German: `loadLocale()` returns `de` without localStorage. `app.html` now says
  `lang="%lang%"` and `hooks.server.ts` fills it with `de`, or `en` under `/admin` (English-only).
  The root layout's `$effect` then sets the language shown. The link-preview text stays English
  as planned (`og:locale=en_US`), because it is written for a share into any chat, not a
  translation of the page
- **Reduced motion is a fade of ≤ 120 ms, not duration 0.** The token table says "opacity only,
  ≤ 120 ms", which is kinder than a jump cut and still honours the setting. `$lib/motion` turns
  fly, slide and scale into that fade (`reducedTransition()`, unit-tested with `cubicBezier()`)
- **The focus ring is an `outline`** (`focus-ring` utility: 2 px `focus`, offset 2 px), not the
  board's stacked `box-shadow`. An outline sits on top of a glow instead of replacing it and
  follows the radius
- **One extra token, `--color-coin-rim`** (`#8a5a00`), which the table names under `score`
- **The header shows no wordmark on `/` yet.** The game screens still draw their own "Geekster"
  title until 9c (playing) and 9e (welcome, result), and two titles on one screen would look
  broken in a 9b release. `+layout.svelte` has `screenDrawsTitle` for it: **9c must switch it**
  to `phase !== 'welcome'` when it removes `GameScreen`'s `<h1>` and its PRO pill, and 9e to
  always-on-except-welcome. The PRO badge in `AppHeader` already follows a Pro run
- **`ModeChoice` is not rebuilt on `SegmentedControl` yet.** That restyles the welcome screen, which
  is 9e's. The primitive exists and has both states (gated, Pro chosen) on `/styleguide`
- **`brand:render` needs no `ws`:** Node 22's built-in `WebSocket` drives the DevTools protocol.
  It expects `npm run dev` to be running and reads the asset list from
  `/styleguide/brand/assets.json` (`src/lib/brand.ts`), retries a page whose font didn't load
  (Vite's first-request optimising can drop one), and refuses an OG image over 300 kB. The OG image
  came out at 84 kB as a palette PNG; the wordmark on it is 72 px, since 88 px ran into the cards
- **The OG image uses seed screenshots** from `static/screenshots/` (Super Mario 64, Half-Life 2 as
  the `????` card, The Last of Us), so rendering it needs no database
- **Measured:** `/styleguide` at 390 and 1280 px, no horizontal scroll (the 68 px wordmark scrolls
  inside its row on a phone); `/` looks as before apart from Exo 2 as the body face and the header;
  the switch sets `lang` to `en` and back, and it survives a reload. Only the six latin
  woff/woff2 pairs are emitted by the build (Dela Gothic One's is 14 kB)
- **Staging checked (2026-09-27, `203d335`, CI green):** `lang="de"`, all 19 description / `og:*` /
  `twitter:*` / `theme-color` tags, `og:image` absolute
  (`https://staging.geekster.pro/og-image.png`, 200, 86 kB PNG), the hashed Dela Gothic One
  preload, `favicon.ico`, `apple-touch-icon.png`, `site.webmanifest` (`application/manifest+json`)
  and `/styleguide/` with `robots: noindex`
- **Moved to the redesign's release (decision 9):** the release PR `develop` → `main`, and after
  it the messenger and opengraph.xyz checks on production (the "Verify" box above, left open)

#### 9c — The HUD (`develop`; built on `feature/redesign`, merged 2026-09-28)

**Scope:** the HUD and everything it reports, on the playing screen. The card, the timeline rows,
the slots, drag, the bonus panel and the reveal keep their look (9d); welcome and result keep
theirs (9e). The playing screen looks half-new until 9d, which staging may show (decision 10).
**Done when** every box is ticked, a Normal and a Pro run are played on the dev server through a
wrong placement and a streak of 10 (with a life missing and with lives full), reduced motion is
checked with the emulation on, and the branch preview builds.

- [x] **First commit, no visual change:** split `GameScreen.svelte` into `RunHud`,
      `StreakMeter`, `CurrentCard`, `Timeline` / `TimelineRow` and `FeedbackToast`, plus
      `src/lib/dragPlace.svelte.ts` for the HTML5 and touch drag logic (long-press, auto-scroll,
      `findSlotUnderPoint`). Verified by playing a run on the dev server before anything is
      restyled
- [x] `streakMeter()` in `placement.ts` with Vitest cases: 0, 1, 7, 10, 11, 20; lives full and
      not full; multiplier at 0, 1, 5 and 6
- [x] `StreakMeter` and the hearts per the spec above, including the regain and break animations
      (through `motion.ts`). `heart-pop` in `app.css` still glows red (`rgb(239 68 68)`): move it
      to `--color-life`
- [x] `RunHud` on a `Surface` with the magenta frame (red for the wrong moment), fixed-width, with
      a `compact` prop for the one-line layout. 9d wires `compact` to dragging and the header
      collapse to the bonus keyboard; 9c only builds both and shows them on `/styleguide`
- [x] The currency: its icon, and `hud.rupees` replaced by a key named for the currency, EN + DE.
      The score counts up to its new value (reduced motion: it jumps)
- [x] "Placed" leaves the HUD. The count becomes the timeline's heading ("Your timeline · 13")
- [x] The toast replaces the fixed banner: announced politely, placed so it doesn't cover the HUD,
      2.5 s instead of 5
- [x] The Pro badge moves into the app header: delete `GameScreen`'s PRO pill and `<h1>`, and
      replace `screenDrawsTitle` in `+layout.svelte` (today `pathname === '/'`) with
      `pathname === '/' && gameState.phase === 'welcome'`: the welcome screen keeps its own title
      until 9e, the result screen has none (its headline is "Game over" etc.)
- [x] Remove the strings that lose their use (`hud.placed`, `hud.livesFull`, `hud.streak`,
      `hud.rupees`) and add the new ones in EN + DE; tick the boxes here and add a "9c — what was
      built" list like 9b's for anything that differs from this plan

##### 9c — what was built, and where it differs from the plan above (2026-09-28)

- **The split** (`f993541`, no visual change): `RunHud`, `StreakMeter`, `CurrentCard`,
  `Timeline` / `TimelineRow`, `FeedbackToast`, and the `DragPlace` class in
  `src/lib/dragPlace.svelte.ts`. `GameScreen` creates one `DragPlace` and hands it to the card
  and the timeline. It went from 563 to ~230 lines, most of them the bonus panel and the reveal, which
  are 9d's. Checked before anything was restyled: a run played with a wrong placement looked as
  before, and a touch long-press drag still placed a card
- **One more pure function than planned: `hudMoment(placementCorrect, streak, lifeRegained)`**
  in `placement.ts` (`wrong` / `lifeBack` / `tenInARow` / `none`, unit-tested). It drives the
  HUD's frame, the heart that breaks or returns, the bar's flash or drain, and the toast's tone.
  **The moment is derived from state, not a timer:** it lasts from the placement to "Next card"
  (`GameScreen` passes `null` once `lastPlacedGameId` is cleared). Only the toast has a timer
  (2.5 s, in `FeedbackToast`)
- **The caption with lives full** reads "In a row, up to ×1.5", or "Max multiplier" from ×1.5.
  The spec said "the multiplier status". "Next card ×1.2" was tried and dropped, because it only
  repeated the chip
- **`hud.livesFull` became `hud.livesFullSpoken`**, used only in the bar's `aria-label`
  ("Streak 7, multiplier ×1.5, all lives full"). On screen, lives full is the absence of the
  socket. Removed as planned: `hud.placed`, `hud.streak`, `hud.rupees`. Removed as well:
  `hud.life`, `hud.nextLife` and the banner's `game.correct` / `game.wrong` /
  `game.livesRemaining` / `game.noLivesLeft` / `game.lifeRegained`. New: `hud.*` (label, lives,
  streakCount, toNextLife, plusLife, multiplierUpTo, meterLabel, credits, creditsShort),
  `toast.*` and `timeline.heading`
- **Numbers follow the shown language:** `formatNumber()` / `formatMultiplier()` in
  `i18n.svelte.ts`, so German reads `2.340 CR` and `×1,5`. The old HUD used the browser's
  locale
- **The wrong toast names the answer** ("Portal is from 2007 · −1 life"), as on the board. The
  correct toast says "+100 · streak N": only the placement's points are known before the bonus
- **The life-back arc goes around the score**, not through it. The board's arc crossed the credits,
  and 9a's rule is that decoration never runs through text. It leaves the box to the right of the
  score, runs just above the HUD's top edge and drops into the returning heart, drawn right to
  left (`arc-travel`, whose clip reaches 12 px outside the box). The SVG is measured
  (`bind:clientWidth`), since a positioned SVG doesn't stretch between `left` and `right`
- **The heart socket's box stays when the socket is gone**, so the bar is the same width in
  every state (U2)
- **Added to the primitives:** `Heart` `broken`; `Surface` frames `danger-glow` and `life-glow`
  (the HUD's moments; `danger` keeps its own fill, these keep the tone's); tokens
  `--shadow-glow-danger`, `--shadow-glow-life`, `--shadow-glow-segment`; keyframes
  `heart-fade`, `heart-break`, `bar-flash`, `arc-travel`, and `heart-pop` now glows in
  `--color-life`; `countUpDuration()` in `$lib/motion` (`DURATION.reveal`, or 0 with reduced
  motion); `PLACEMENT_POINTS` and `MAX_STREAK_MULTIPLIER` in `scoring.ts`. **Off segments are
  `accent-soft`**: the board's `#0f3440` isn't a token
- **The header collapse is `AppHeader`'s `score` prop**: the score takes the language switch's
  place. `/styleguide` shows it with the Pro badge. `RunHud`'s `compact` layout and every HUD state
  are there too, plus a live HUD played with `applyPlacement()` (Correct / Wrong / Streak 9 /
  Compact). **9d wires both:** `compact` to `drag.isDragging`, `score` to the bonus panel with
  the keyboard open
- **Until 9d's two columns, the HUD and the toast take the card's width** (`max-w-2xl`, centred). At
  1280 px they ran edge to edge
- **The result screen now shows the header wordmark**, without the header's PRO badge
  (`proRun` is playing-only). Its own PRO pill and headline stay until 9e
- **Transitions:** `CurrentCard` and `GameScreen` import `fly` from `$lib/motion` now.
  **`ScoreReveal`, `GameCard` and `BonusGuessPanel` still use `svelte/transition` directly**, so
  under reduced motion the bonus panel still flies in. They are 9d's components
- **Verified on the dev server with headless Brave (2026-09-28):** a Normal and a Pro run each
  played through a wrong placement, then 10 in a row with a life missing (pink frame, heart pop,
  arc, "10 in a row · +1 life won back"), then 20 at full lives ("Lives already full · ×1.5
  holds", no life). The drain sweeps right to left and the chip drops to ×1.0. With
  `prefers-reduced-motion` emulated, the only HUD keyframe that runs is `heart-fade`: no break,
  flash or arc, and the credits jump (0 → 100 at once, against ~900 ms counting up without it).
  German, 320 px (no horizontal scroll), 1280 px, the touch long-press drag and an HTML5
  drag-and-drop all checked. `/styleguide` at 390 and 1280 px
- **Branch preview checked (2026-09-28, `d7737a1`):** Vercel built it
  (`geekster-git-feature-redesign-kaiserlikes-projects.vercel.app`, behind Vercel
  Authentication), and a card played there against the staging database showed the new HUD and
  the toast. CI doesn't run on a `feature/*` push (only on PRs and on `main` / `develop`), so
  lint, format, check, test and build were run locally before the push, all green
- **Playing Pro locally** needs Pro primaries in `local.db` and the gate lowered. This session
  copied 40 Normal primaries as `difficulty = 'pro'` rows (local file only), and started
  `npm run dev` with `PRO_MIN_POOL_OVERRIDE=5` in the shell's environment rather than in `.env`

#### 9d — The playing screen (`develop`)

**Scope:** everything on the playing screen below the HUD: the card to place, the timeline rows
and slots, drag, the wrong-placement feedback, the bonus panel, the reveal, and the desktop
layout. Welcome and result keep their look (9e). **Done when** every box is ticked, a Normal
and a Pro run are played on the dev server at 390 and 1280 px through a correct placement with a
bonus guess, a wrong one and a timeline past `COMPACT_TIMELINE_AT`, reduced motion is checked
with the emulation on, and the slice is pushed to `develop` and checked on staging (decision 10).
If it runs long, the bonus panel and the reveal can go into their own session (see "Delivery
order").

- [x] **Wire up what 9c built:** `RunHud`'s `compact` to `drag.isDragging`, and `AppHeader`'s
      `score` while the bonus panel has the keyboard open (the HUD collapses into the header;
      `+layout.svelte` renders the header, so it needs to know). Both states are on `/styleguide`
- [x] **Transitions through `$lib/motion`:** `ScoreReveal`, `GameCard` and `BonusGuessPanel` still
      import from `svelte/transition`, so the bonus panel still flies in with reduced motion.
      After 9d, `grep -rn "svelte/transition" src/lib/components/*.svelte` comes back empty
- [x] **Timeline rows year-first:** the year large on the left, the name, a small thumbnail (as in
      all four drafts). Check `COMPACT_TIMELINE_AT` (12) again: with ~64 px rows the thumbnails may
      be able to stay for longer, and the card just placed stays full-size for its reveal as
      today
- [x] **Slots:** "Place here" between rows, 44 px high, the drop target highlighted while
      dragging, and keyboard focus visible. The copy says tapping works ("Drag or tap a slot",
      U11)
- [x] **Current card:** it shrinks to a thumbnail strip while dragging and once the timeline has
      scrolled under it (U9). The year chip shows "????", never a partial year
- [x] **Wrong placement (U8):** a ghost at the slot the player chose, the card sliding to where it
      belongs, both on screen for a moment before the reveal
- [x] **Bonus panel (U12, U13):** `type="text"` with `inputmode="numeric"`, `pattern="[0-9]*"` and
      `maxlength=4` for the year. The placeholders go through i18n. Autofocus only where
      `(pointer: fine)` holds, so a phone opens its keyboard when the player taps, not at once.
      The timer is announced at 10 s and 5 s, never every second. It's still 30 s
- [x] **Reveal:** the answer card and the score breakdown in the new look. Each result keeps its
      text label ("Exact", "Close", "Nope") next to its colour and gets an icon. "Next game" also
      responds to Enter
- [x] **Desktop ≥ 1024 px:** two columns in a fixed `100dvh` shell. Only the timeline pane
      scrolls (9a's design call "Desktop with a long timeline")
- [x] **Decade ruler** (`DecadeRuler.svelte`) fed by a pure, unit-tested
      `decadeBuckets(timeline)` in `placement.ts` (decade, count, index of its first card).
      Buttons with `aria-label` "1990s, 8 cards", `aria-current` on the one in view (an
      `IntersectionObserver` on the decade labels), click scrolls, hover while dragging scrolls
- [x] **Pinned decade labels** in the timeline (`position: sticky` inside the pane)
- [x] **Drag auto-scroll in the pane** on desktop (HTML5 `dragover` near the edges), sharing the
      speed curve with the existing touch auto-scroll in `dragPlace.svelte.ts`
- [x] **No scroll that leaks the answer:** the pane keeps its position between cards. It scrolls
      only on reveal, to the placed card (and on a miss to its ghost too). Checked by playing a
      run and watching the pane between cards
- [x] Phone: try the decade ruler as a narrow strip on the right edge. Keep it only if it doesn't
      crowd the rows, and record the decision here. **Decided: no ruler on a phone** (below)

##### 9d — what was built, and where it differs from the plan above (2026-09-28)

> **Superseded the same day: one column on every screen (decision 11, user, 2026-09-28).** The
> two-column desktop felt unintuitive to the user: the card and where it goes sat side by side,
> the eye jumping left and right, and a short timeline left half the screen empty. Switching
> layouts at N cards or at "the timeline scrolls" was considered and rejected: it would move the
> card and the HUD mid-run, at a moment that depends on the window height. So a desktop now gets
> the phone's model, larger:
>
> - one column within 880 px (the header aligned to it), the page scrolls; the card's width is
>   also capped by the window height, `(100dvh − 26rem) · 16/9` (876 px at 2000 × 945, 679 px at
>   1280 × 800), so the first slot is in view
> - once the card has scrolled off, **a bar pinned to the top** with the compact HUD and the
>   card's strip (draggable) — on every screen, the phone included. While dragging the card
>   shrinks to the strip and the HUD goes compact, on every screen
> - **the decade ruler** is `fixed` to the right of the column from 1280 px (`xl`), from 8 cards,
>   once the page scrolls and with two decades or more; a decade's first row scrolls to just
>   under the pinned bar (`scroll-mt-40`)
> - HTML5 drag auto-scrolls the page (a window `dragover`, the 150 px zone of touch); the cue
>   sits at the viewport's edge
> - **user review of that (2026-09-28):** every pressable element now shows the pointer — a
>   base rule in `app.css`, since Tailwind v4's preflight gives `button` `cursor: default` — and
>   the hovers are visible: the primary button brightens and glows more, secondary and icon
>   buttons fill `accent-soft`, ruler buttons fill too. **The ruler is the timeline in
>   miniature:** each decade's button takes its share of the timeline's measured height (label to
>   the next label), not of the card count, so it lines up with what the page shows. **The decade
>   in view** is the one of the first row whose middle is below the pinned bar; **a decade picked
>   on the ruler stays picked** while one of its rows is on screen, until the player scrolls
>   themselves (wheel, touch, key) — near the page's end the scroll can't bring its first row to
>   the top, so the old "first row passed the top" rule lit the decade above
> - **second review (2026-09-28):** the toast **floats over the top-left corner** (`fixed`,
>   `pointer-events-none`, above the pinned bar, with a shadow) instead of sitting in the flow
>   under the HUD: its 2.5 s coming and going moved the bonus panel, so a tap meant for Skip or
>   a field could land on the wrong thing. It still is the polite live region (U7's point). And
>   **on a correct placement "Next card" is the answer card's last line**, arriving after "Round"
>   (a sixth step of the stagger); it takes focus when it appears, so Enter still works. On a
>   miss it stays pinned to the bottom, where the ghost may have scrolled the page
> - **third review, the user's idea (2026-09-28): no toast; the card turns into its verdict.**
>   `PlacementResult.svelte`. After a correct placement the screenshot stays where the card was,
>   its frame takes the verdict's colour and an opaque panel scales in over it (✓ "Correct · +100 ·
>   streak N", ♥ pink for a life back, ★ for ten in a row with lives full) for 1 s
>   (`VERDICT_MS`; 0.7 s at first, 1 s after the user tried it), then the stage turns into the bonus round: the stage's height glides
>   (`transition-[height]` on a measured wrapper, 400 ms) while the verdict fades over the arriving
>   panel (both in one grid cell). **The verdict waits for the card to be in view** (a phone
>   scrolls to the top first; `whenAtTop()`, at most 1.2 s), and the bonus timer starts only when
>   the fields are there. A tap on the verdict skips to the bonus round. **A miss** shows the
>   verdict as one red line (thumbnail, ✗, "Wrong · Portal is from 2007 · −1 life"),
>   `sticky top-2`, so it stays in view while the page scrolls to the ghost; that scroll waits for
>   the stage's glide (else it measured stale positions) and centres the pair below the pinned
>   line. The words are spoken by a `sr-only` polite live region in `GameScreen`.
>   `FeedbackToast.svelte` is deleted; the `Toast` primitive stays for later use. Reduced motion:
>   no scale, no glide, the fades are ≤ 120 ms
> - gone: the `100dvh` shell in `+layout.svelte`, the timeline pane and `drag.setPane()`, the
>   pinned heading and pinned decade labels (the labels stay, in the flow), the fluid two-column
>   grid, the desktop "mid-drag" hint. The page scrolls to the top for the bonus panel, the answer
>   card and the next card on every screen
>
> Everything below that mentions the pane, the shell, the left column or the pinned labels
> describes the two-column version and is kept as history. The lightbox stays.

- **Layout.** `GameScreen` is one flex column on a phone and, from `lg` (1024 px), a grid
  `440px | 1fr` with rows HUD · toast · stage · actions on the left and the timeline spanning them
  on the right. `+layout.svelte` makes the page a `lg:h-dvh` shell with `overflow: hidden` only
  while `phase === 'playing'`, so welcome and result still scroll. The "stage" is the card to
  place, the bonus panel or the answer card, one at a time, where the card was
- **"Next card" is pinned to the bottom of a phone** (`sticky bottom-0`) during a reveal, on both
  boards. On a miss the page scrolls to the ghost, often far from the top, and a button under the
  answer card would be off screen. It takes focus when the reveal starts, which is how Enter works
  (plus Space, as on any button); a 300 ms guard stops the Enter that submitted the guess from
  also skipping the reveal. On desktop it sits under the answer card in the left column
- **A miss shows no answer card** (as on `M3RevealWrong`): the toast, the ghost and the red
  "Belongs here" row say it all, and the round's points are 0. The ghost's slot comes from the pure
  `ghostSlotIndex(chosenSlot, insertedAt)`; the row slides from the ghost to its place with the Web
  Animations API (900 ms after a 400 ms pause), on the row inside the `li`, so the reveal's scroll
  measures the `li` where it stays. Reduced motion: no slide
- **The reveal's scroll** (`Timeline.revealInView()`): nothing moves if the card (and ghost) are
  already in view; else the pair is centred, or — when a far miss doesn't fit both — the scroll
  follows the card to where it belongs. On a phone a correct placement scrolls to the top instead
  (the bonus panel, then the answer card); "Next card" goes to the top too. Checked: between cards
  the pane's content stays put (browser scroll anchoring adjusts `scrollTop` when slots return
  above the view; nothing on screen moves)
- **`COMPACT_TIMELINE_AT` is 20 now and lives in `Timeline.svelte`.** A year-first row with its
  thumbnail is ~64 px, a compact one 40, so on a phone the saving is only ~25 % per card and the
  thumbnails earn their place longer. The result screen keeps `GameCard` with its own
  `COMPACT_RESULT_AT = 12` until 9e restyles it. Rows no longer collapse while dragging (9c did
  that); the slots grow to 60 px instead, and in a compact timeline only the drop target grows
  (52 px) — 60 px for every slot doubled a 25-card list mid-drag
- **The card just placed during the bonus guess** shows `????` and "Just placed" in place of its
  year and name, since the name is the other half of the question. Revealed, it's framed
  turquoise; missed, red
- **Slots have an accessible name that starts with the visible text:** "Place here, between Super
  Mario 64 (1996) and Kingdom Hearts (2002)" (WCAG 2.5.3), so a screen-reader or keyboard player
  knows where each slot is. The card's hint says tapping works (U11): "Drag it onto a slot, or tap
  one." on a coarse pointer, "… or click one. Keyboard: Tab to a slot, Enter to place." on a fine
  one (Tailwind's `pointer-coarse:` / `pointer-fine:`). Mid-drag on desktop the hint points at the
  pane's edges and the ruler (`M3DeskLong`)
- **The phone strip** (U9): while dragging, the in-flow card turns into the `M3Drag` strip, unless
  it has already scrolled off, where shrinking would move the slots under the finger. Once it has
  scrolled off (an `IntersectionObserver`), a strip is pinned to the top, and it can be dragged
  too; a touch on it keeps it mounted until the finger lifts, because a touch whose target leaves
  the DOM stops reaching the window's `touchmove` listener. Parts are hidden with CSS, never
  unmounted, for the same reason. The floating card is the board's: 150 px, tilted −4°, magenta
  glow. Desktop keeps the card in place as a dashed placeholder at 30 % while dragging
- **The HUD's two states are wired:** `compact` = dragging on a phone (desktop keeps the full HUD,
  as on `M3DeskLong`); the header collapse = a bonus field has focus on a coarse pointer (the phone
  keyboard is up) — the HUD unmounts and `AppHeader` gets `score` through `headerScore`
  (`src/lib/headerScore.svelte.ts`, module state written only from an effect, so the server
  renders null)
- **Bonus panel:** the M3 panel on `Surface` magenta with `TextField`s. The year is `type="text"`,
  `inputmode="numeric"`, `pattern="[0-9]*"`, `maxlength=4`, and only 1–4 digits count as a guess.
  Autofocus only on `(pointer: fine)`. The seconds are silent (`aria-hidden`); a polite `sr-only`
  region says "10 seconds left" and "5 seconds left"; from 5 s the count and the bar turn `danger`.
  The "Correct placement!" line is gone (the toast says it) and so is the `placementCorrect` prop.
  The hint "Up to +50 for the year, +50 for the name" reads `MAX_YEAR_BONUS` / `MAX_NAME_BONUS`,
  now exported from `scoring.ts`. At 320 px in German "Überspringen" doesn't fit beside
  "Aufdecken", so the button row wraps. `TextField`'s input got `w-full min-w-0` (it overflowed a
  grid cell)
- **Answer card** (`ScoreReveal`, which now includes the answer): the 21:9 screenshot, name, year
  in the display face with the split, then Placement / Year / Name / Streak / Round, staggered as
  before. Verdicts are ✓ exact, ~ close (some points), ✗ nope, — skipped, always beside the word
- **Decade ruler and pinned labels** (desktop): `decadeBuckets()` in `placement.ts`; the ruler
  shows only once the pane overflows and holds two decades or more: on staging a two-card
  timeline stretched it into two buttons of 400 px each, an overview of nothing. The decade in view
  is computed on the pane's scroll (rAF-throttled `getBoundingClientRect` of each decade's first
  row against the pinned heading) rather than an `IntersectionObserver`: "which one has passed
  the top" is one comparison, and a sticky label's own position can't be used. The heading
  "Your timeline · N · oldest at the top" is pinned at the pane's top (36 px) and the decade
  labels under it (`top-9`); a decade's first row has `scroll-mt-[72px]`, which is what the ruler
  and a mid-drag hover scroll to. On a phone the labels are shown, not pinned
- **No decade ruler on a phone** (decision): at 390 px the row is 358 wide; a 44 px ruler and its
  gap leave ~300, and after the 58 px year and the 92 px thumbnail the name gets ~110 px — two
  lines for most titles. The phone has page scroll with its 150 px auto-scroll zone instead
- **Button** got a bindable `ref` (for the focus on "Next card"). `/styleguide` has two new
  sections: slots, rows, the ghost and the ruler; and a live bonus panel beside two answer cards
- **Strings:** new `card.*`, `timeline.*` (oldestFirst, decade, decadeShort, justPlaced,
  youPutItHere, belongsHere, scrolling, ruler, rulerDecade), `slot.first/between/last`,
  `bonus.round/seconds/secondsLeft/yearPlaceholder/namePlaceholder/hint`,
  `score.exact/close/nope/offBy/streak/round`. Removed: `game.dropOnSlot`,
  `game.placeInTimeline`, `game.yearGuess`, `game.nameGuess`, `game.exact`, `game.close`,
  `game.nope`, `game.offByYears`, `bonus.correctPlacement`, `bonus.wrongPlacement`,
  `bonus.bonusGuess`, `score.guessed`, `score.actual`, `score.streakBonus`, `score.roundTotal`.
  "Next Game" reads "Next card"
- **User feedback on desktop (2026-09-28), fixed the same day.** At 2000 × 945 the 440 px left
  column left the card at ~345 px and half the screen empty. Now:
  - **fluid columns**: left `min(50%, (100dvh − 24rem) · 16/9)` — half the width, or less when
    the window is too short for a 16:9 card that wide under the HUD — and the timeline the rest,
    the whole grid within 1760 px and centred, the header aligned to it. Measured: 880 / 832 px
    at 2000 × 945 (card 876 × 493), 600 / 552 at 1280 × 800, 680 / 632 at 1440 × 900. The 440 px
    column and the 680 px timeline of the 9a boards are superseded
  - the answer card's image is capped at `min(26dvh, 100dvh − 41rem)`, so the answer, a toast
    and "Next card" fit even at 1280 × 720 (the image becomes a strip there); the stage cell can
    scroll as a last resort, padded so the card's glow isn't clipped
  - **a lightbox for the card to place** (`ui/Lightbox.svelte`, bits-ui's dialog like the admin
    panel's `ImageLightbox`, in the tokens): a click on the image or its ⤢ button opens it at
    16:9, as large as the screen allows (`min(94vw, 88dvh · 16/9)`; a 320 px seed shot is scaled
    up), with the `????` chip, a Close button that takes focus, Escape and a click beside it. A
    click within 400 ms of a drag ending opens nothing, so a let-go long-press doesn't. Checked:
    mouse click, button, Escape, a phone tap (opens) and a long-press drag let go (doesn't)
- **Staging checked (2026-09-28, `86dcac1`, CI green):** a card played on staging.geekster.pro
  (access link) at 390 and 1280 px against the staging database: the miss's ghost and "Belongs
  here", the fixed shell (`overflow: hidden`), the new HUD and toast. The ruler fix above came
  out of it
- **Verified on the dev server with headless Brave (2026-09-28)**, drivers in `scratchpad/cdp/`
  (`run9d.mjs`, `drag9d.mjs`, `touch9d.mjs`, `kb9d.mjs`, `keys9d.mjs`, `leak9d.mjs`,
  `shotnow.mjs`, `sg9d.mjs`; `play.mjs` places N cards): Normal at 390 and 1280 through a bonus
  guess (year one off, name exact → ✓ ~ ✓), a miss and 25 cards (compact rows, ruler, pinned
  labels); Pro at 1280 with the PRO badge; a far miss at both widths (the scroll follows the card);
  German at 320 (no horizontal scroll after the button fix); reduced motion (only opacity
  animations run); a touch long-press drag with the strip, the compact HUD and the floating card;
  the header collapse on a focused field with touch emulation, and the 10 s / 5 s announcements;
  HTML5 drag at 1280 onto the pane's edge (cue and scroll), a ruler hover mid-drag, and a drop;
  a whole placement by keyboard (Tab to a named slot, Enter, Enter, Enter). **Two harness notes:**
  a headless tab fires no focus events without `Emulation.setFocusEmulationEnabled`, and CDP's
  `dispatchDragEvent` didn't deliver `dragOver` at the pane's middle, so the stop-scrolling path
  was exercised with an in-page `DragEvent`

#### 9e — Welcome, result, leaderboard (`develop`)

- [x] **Welcome (U14):** the wordmark, a one-line pitch, the mode choice, and Play as the one
      dominant action. The six rules go behind "How to play" (a disclosure or a dialog). First-run
      help as asked at the slice start, remembered in `localStorage` (a new key, documented next
      to `geekster-mode`)
- [x] **Mode choice** on `SegmentedControl`. Pro "Coming soon" keeps its locked state and its
      note
- [x] **Result (U15, U16):** the headline, the score and the stats first, then **Play Again and
      Main Menu directly under them** (above the fold, so no sticky bar: see 9a's design calls), then the
      leaderboard, then the timeline with the misses marked
- [x] **Leaderboard** tabs restyled, with empty and loading states
- [x] Loading and error states on the welcome screen (the error with its retry, as today)
- [x] Pushed to `develop` and checked on staging (`c4717e9`, CI green, 2026-09-28: the whole
      flow at 390 px against the staging database, via an access link)

##### 9e — what was built, and where it differs from the plan above (2026-09-28)

- **First-run help is a coach mark** (the user's choice at the slice start, over a 3-step
  overlay). `CoachMark.svelte` sits in the flow between the card to place and the timeline, a
  turquoise callout with a notch pointing down at the slots: "Your first card · Portal is from 2007. Is this card older? Put it above. Newer? Below." The card's own hint (drag, tap/click,
  keys) stays under the card, so the callout only adds the ordering rule. It goes with the first
  placement or its ✕, both writing `localStorage['geekster-coach-seen'] = '1'`
  (`src/lib/firstRun.ts`). **A browser with a finished run counts as having seen it**
  (`hasPlayedBefore()` in `leaderboard.ts`: any Normal, Pro or Classic entry), so players from
  before 9e never get it; blocked storage shows it never (it would come back every run). In the
  flow rather than floating, so it never covers a slot
- **Welcome.** First visit: the 44 px wordmark with the tagline (68 px from `lg`), the pitch as
  the `h1` in the display face ("Put video games in order."), one sentence of rules, the mode
  choice, START RUN (`Button lg`), "How to play ▸". **Returning** (a finished run in this
  browser): "Welcome back. Your best: N CR" (the chosen mode's best; without one, just the
  greeting), the pitch as an `sr-only` `h1`, and the leaderboard (5 rows) between START RUN and
  "How to play", as on `M3Returning`. Desktop is two columns (`M3DeskWelcome`): the left one as on
  the phone with the mode choice and START RUN side by side; the right one the leaderboard for a
  returning player, or for a first visit a decorative tilted timeline (three seed rows and a
  `????` card, `aria-hidden` and `inert`). The header widens to the welcome screen's 1120 px
  there (`AppHeader wide`), so the language switch lines up
- **The horizon grid never shows through text:** it isn't layered behind the content (the boards
  put it behind "How to play") but takes the space the content leaves at the bottom of the
  screen, at least 96 px, `flex-1`. Opening "How to play" pushes it down
- **"How to play"** is a disclosure (`HowToPlay.svelte`, a button with `aria-expanded` and the
  six rules in a `Surface`-style list, `slide` from `$lib/motion`), not a dialog: the rules are
  short and a dialog would hide the Start button they lead to
- **Mode choice** is `SegmentedControl` (`ModeChoice.svelte` is now a thin wrapper): Pro pink,
  locked with the `COMING SOON` badge and `aria-describedby` on its note, which now sits in the
  same line as the mode hint
- **Loading and error:** START RUN shows `Button`'s spinner and "Loading"; the error is the
  `M3States` box (`Surface frame="danger"`, ✗ + the title, the message, `role="alert"`) above the
  mode choice, and the button reads "Try again". Checked by failing `/api/games/random` in the
  page
- **Result** (`M3Result`, `M3Perfect`): the mode chip (Normal turquoise, Pro pink), the headline
  in the display face with the split and a glow by outcome (Game over red, Pool cleared
  turquoise, Perfect run gold), the pool-cleared hint, the score (40 px, gold), "New personal
  best" when the run tops an earlier one or "#N of your runs", four stats (Placed, Misses red
  when > 0, Best streak, ♥ Back; short labels on screen, the full names for a screen reader),
  then **Play again / Menu** — above the fold at 390 × 844 after any run. A perfect run gets the
  striped sun on a horizon between the actions and the board. Then the leaderboard (this device /
  global) and "Your timeline · N": compact `TimelineRow`s, the misses with the new `missed`
  status (red frame, red year, ✗ with an `sr-only` "misplaced"), a legend "✗ = misplaced", 14
  rows and "+ N more" (all of them when only one would be hidden). **Misses are recorded as they
  happen:** `GameState.missedIds`, pushed by `placeGame()`; `roundScores` is in placement order
  and has no game id. `GameCard.svelte` and `COMPACT_RESULT_AT` are deleted
- **Every phase starts at the top** (`+page.svelte`): a run ended wherever its timeline had
  scrolled to, and the result screen opened there (found at 1280 px)
- **Leaderboard** (`Leaderboard.svelte`, rewritten): a `Surface` with the magenta frame, ARIA tabs
  (arrow keys, Home, End, roving `tabindex`) "This device" / "Global" / "Classic" (only under
  Normal and when this browser has a classic list), rows of rank · score in CR · "23 placed ·
  26 Sep" with a `NEW` chip on the run just finished (always shown, whatever its rank) and a
  `PERFECT` / `CLEARED` chip. The global list is fetched per mode on first view and kept per mode
  (the old one fetched once and showed Normal's list after switching to Pro). Empty: the dashed
  box "No runs yet. Your first one lands here."; loading: three opaque skeleton rows,
  `motion-safe:animate-pulse`; failed: "Global leaderboard unavailable". The player column is gone
  (every name is "Anonymous" until Sprint 10), and so is the streak column
- **`formatShortDate()`** in `i18n.svelte.ts` ("26 Sept", "26. Sept."), which also reads SQLite's
  `2026-09-20 19:10:33` as UTC (Safari won't parse it as it is)
- **Strings:** new `welcome.pitch/pitchDetail/back/yourBest`, `coach.*`,
  `result.personalBest/rank/bestShort/livesBackShort/missed/missedLegend/more`,
  `leaderboard.new/placedCount/empty/loading`; `result.yourTimeline` takes the count. Changed:
  START RUN / "Run starten", "Play again" / "Nochmal", "Menu" / "Menü", "Misses", "This device" /
  "Gerät". Removed: `welcome.subtitle`, `welcome.topScores*`, `result.points`,
  `leaderboard.score/result/streak/date/placed/player`
- **`/styleguide`** has a section for ModeChoice (gated), HowToPlay, CoachMark and the
  Leaderboard (with a NEW row, and empty); `TimelineRow`'s list shows `missed`
- **Verified on the dev server with headless Brave (2026-09-28)**, drivers `scratchpad/cdp/e9*.mjs`:
  a first visit → How to play → a run with the coach mark (gone and the key written after the
  first placement; ✕ dismisses; a second run has none) → R R W R W W → the result with 3 misses
  marked → Global tab (skeleton, then the list) → Menu → returning welcome, at 390 and 1280 px in
  English and at 390 in German; the coach mark with touch emulation in German; the gated Pro
  choice with a stored Pro (plays Normal, the note is the radio's description); a perfect run on
  a 4-game pool (fetch cut in the page); the loading and error states. No horizontal overflow
  anywhere. **Left for 9f:** a returning player's welcome is server-rendered as a first visit and
  swaps after hydration (the choice lives in localStorage); measure its CLS there

#### 9f — Quality pass and admin tokens (`develop`)

- [x] Lighthouse, mobile, on `/` and on a result screen: Accessibility 100, Best Practices ≥ 95,
      SEO ≥ 95, Performance ≥ 90. CLS < 0.1 (screenshots keep their `aspect-ratio` box). On `/`
      (production build, `vite preview`): 95 / 100 / 100 / 100, CLS 0. The result screen is not
      a URL Lighthouse can load (it needs a played run), so it got axe and a CLS measurement instead
- [x] axe-core on every phase, driven by headless Brave over CDP, the way
      Sprint 8 slice 1 was verified
- [x] A whole run by keyboard only; one run with reduced motion on; 320 px wide with no
      horizontal scroll. **Not done by Claude:** VoiceOver on iOS (a hand step, below) and a
      real 200 % browser zoom (1280 px at 200 % lays out as 640 px, between the 390 and the
      1280 px checks, both clean)
- [x] **Admin gets the tokens only:** the body font, and the brand accent where the admin uses
      purple today. Its layout and its green `NORMAL` / blue `PRO` / amber `DRAFT` / red
      `NO SCREENSHOT` semantics stay as they are
- [x] Docs: `CLAUDE.md` § Game Logic (the HUD), `.claude/docs/game-architecture.md`, README
- [x] Pushed to `develop` and checked on staging (`2c249d0`, CI green, 2026-09-28: `axe9f.mjs`
      played a run through all eleven states at 390 px against the staging database, via an
      access link: 0 violations). The release waits for 9g
- [ ] **Hand step (the user):** VoiceOver on an iPhone through one round: start, place a card
      (a slot's name says where it is), hear the verdict, the bonus round's 10 s / 5 s, the
      answer card, "Next card"

##### 9f — what was built (2026-09-28)

The user's brief: accessibility counts, but only the low-hanging fruit; and check that the
redesign's back-and-forth left clean code, not spaghetti. A read-only review of every game
component went first; its findings are below with what came of them.

- **Measured.** axe-core 4.13 (WCAG 2.0/2.1/2.2 A + AA and best practice) on eleven states: the
  first-visit welcome, "How to play" open, the first card with the coach mark, the verdict on the
  card, the bonus panel, the answer card, a miss with its ghost, the result, its Global tab, the
  returning welcome and the admin login, at 390, 1280 and 320 px. **No colour-contrast finding
  in the game.** What it found, all fixed: no `<main>` landmark, no `h1` while playing, and
  12 px `gray-500` links on `gray-900` in the admin (3.7:1). Now 0 violations everywhere.
  Lighthouse mobile on `/`: 95 / 100 / 100 / 100, CLS 0, LCP 2.7 s (the display font)
- **CLS of a returning player's welcome** (left over from 9e): 0.108 at 1280 px, because the
  server renders a first visit and the board replaces the decoration after hydration, moving the
  left column. The right column now keeps the decoration's height (484 px, as tall as a five-row
  board): 0.03. At 390 px it was 0 already
- **Landmarks and focus.** The game's content is in `<main>` (root layout), the admin login has
  its own. Every phase has one `h1` (the playing screen an `sr-only` "Your run"). **On a phase
  change focus moves to the new screen's `h1`** (`tabindex="-1"`, `+page.svelte`): after START
  RUN, "Result" and "Menu" the pressed button is gone and focus fell back to `<body>`, where a
  screen reader says nothing
- **Keyboard only** (1280 px, Tab / Enter): START RUN → Tab to a named slot → Enter → the bonus
  field has focus → Tab to Skip → "Next card" takes focus once the breakdown is in → a miss →
  game over → focus on "Game Over" → Tab to "Play again" → a new run. Every stop showed the
  focus ring. **Reduced motion:** sampled `document.getAnimations()` through a run: only colour,
  border, shadow and opacity change; with motion on, transform, height and scale do as well
- **The footer** was `text-gray-700` at 10 px (about 1.9:1): now `ink-subtle` at 12 px, the link
  with the focus ring. 9g redoes the footer; this is only its contrast
- **Admin:** `font-body`, and every `purple-*` became the accent: buttons and the active nav item
  `bg-accent text-on-accent` (white on turquoise would fail), links and focus borders `accent`,
  the ready-to-upload box and the selected filter `accent-soft`. `gray-*`, the status colours and
  the layout are unchanged. The `View the game` / `Log out` / `Back to the game` links went from
  `gray-500` to `gray-400`
- **A bug the review found:** during the correct verdict (1 s, plus the phone's scroll) the
  timeline row of the card just placed showed its name and year, the bonus round's question.
  `Timeline` hid it only while `bonusGuessing`. It's `????` now until the reveal
- **One round stage.** `GameScreen` held `verdictStage`, `bonusGuessing` and `bonusRevealing`
  (plus `verdictShown`), combined with guards like `verdict && lastPlacementCorrect === false`;
  some combinations were meaningless and the bug above lived in one. Now one
  `stage: RoundStage` (`card | verdict | bonus | reveal`, `types.ts`), which `Timeline` takes too
- **The toast is gone for good:** `ui/Toast.svelte` (unused by the game since 9d) and its
  styleguide section are deleted; `ToastMessage` is `PlacementVerdict`, `placementToast()` is
  `placementVerdict()` (and uses the derived `moment` instead of computing it again), the
  `toast.*` strings are `verdict.*`
- **The ruler's controller out of `Timeline`.** ~110 of `Timeline`'s 329 lines were the ruler's:
  when it shows, the decade in view, each decade's height, the jump, five window listeners, and an
  effect that re-ran itself (it set `pageOverflows`, which changed `showRuler`, which it
  depended on). That is `DecadeRulerState` in `src/lib/decadeRuler.svelte.ts` now, re-measuring
  from a `ResizeObserver` on the list and the page instead of `tick()` after chosen props.
  `DecadeRuler.svelte` still only draws, so `/styleguide` keeps showing it standalone
- **Smaller:** `--container-run` (912 px) replaces the four copies of the column's width
  (`max-w-run`, and the ruler's `left`); `coach` is `$state` (it was a reassigned `$derived`); the
  two `headerScore` effects are one; `showSlots` lost a redundant `!bonusGuessing`; the ghost is
  `bg-danger-soft`; unused `clearLeaderboard()` and the `--text-shadow-split-glow` token are
  deleted; stale comments about the pane, the toast and the pinned labels are corrected
- **Left as they are** (the review's "could"): `Timeline` reading `[data-pinned-bar]` /
  `[data-verdict-strip]` from other components' DOM; primitive variants used only on the
  styleguide (`Button ghost`, `Surface raised/sunken`, `TextField hint/error`), which are the
  design system's; a few one-off `rgb(...)` glows; `EASE.inOut` duplicated as a string for the
  Web Animations API in `slideFromGhost`
- **Drivers** (gitignored, `scratchpad/cdp/`): `axe9f.mjs <width>` (axe on every phase; it reads
  axe-core from a local `npm pack axe-core`, path at the top), `kb9f.mjs [--reduced]` (the
  keyboard run, with the animation sampler), `cls9f.mjs <base> <width>`, `verdict9f.mjs` (the
  row stays hidden through the verdict), `admin9f.mjs` (screenshots with `PW=`). Lighthouse:
  `CHROME_PATH=<Brave> npx lighthouse http://localhost:4173/ --form-factor=mobile` against
  `npm run build && npm run preview`

#### 9g — Legal pages (`develop`, last)

- [x] **Ask first** (answered 2026-09-28): **Austrian law** (§ 5 ECG, § 25 MedienG). Operator
      Franz Dietrich, Heinrich von Kleist-Gasse 18/4, 2232 Deutsch-Wagram, Österreich,
      franzdietrich@gmx.at — in `src/lib/legal.ts`, the one place both pages read them from
- [x] `/impressum` (German, binding, plus an English translation) and `/privacy` (EN/DE). The
      privacy page covers Vercel hosting and its request logs, Turso (the global scores: a score,
      stats, a timestamp and the name "Anonymous"), Vercel Blob images, `localStorage` (every key
      listed), no cookies for players (the admin session cookie only), self-hosted fonts, no
      analytics yet. **The texts are the operator's responsibility**; Claude drafted them. Before
      the release, check them against the WKO templates or a lawyer
- [x] **Takedown:** rights holders write to the operator's address naming the game and the
      screenshot; it is removed **within 14 days** (`TAKEDOWN_DAYS`), on both pages
- [x] **Screenshot credit:** one global line, "Screenshots © their respective rights holders,
      source: RAWG.io", in the footer and on both pages. **Per-screenshot credit: Sprint 11**, with
      the encyclopedia's developer/publisher data (user decision 2026-09-28)
- [x] The footer: Impressum · Privacy, and the credit on its own line, `ink-muted` links on
      `ink-subtle` text at 12 px (U21). Both pages are indexable and in the new look
- [x] Docs: the routes in `CLAUDE.md` and README; `ROADMAP.md` § Cross-cutting marks the
      Impressum and the credit done
- [x] **The Sprint 9 release** (decision 10): PR #32 `develop` → `main` for 9b–9g, merged
      2026-09-28 (`557f7e4`), no migration; `develop` fast-forwarded to it. **Production checks
      (2026-09-28):** Vercel deployed `557f7e4` to production. `/`, `/impressum/`, `/privacy/`,
      `/styleguide/` (noindex) and `/admin/login/` answer 200; no `X-Robots-Tag` on production;
      `www` 308s to the apex. The favicons, app icons, manifest and `og-image.png` are served.
      The head carries the og/twitter tags with an absolute image URL, and the Dela Gothic
      preload; nothing is loaded from Google Fonts. `/api/games/random` answers 200 and `?difficulty=pro` 409 (still
      gated). Crawler user agents (facebookexternalhit, WhatsApp, Telegram, Twitterbot) get the
      page and the image. axe 0 on both legal pages and the welcome screen, EN/DE, 390/1280 px.
      A fresh first run shows the coach mark and the first card from Blob. opengraph.xyz
      answered 429 (rate limit), so the preview was checked by crawler user agent instead. **Left
      for the user:** send the link in a real messenger once

#### 9g — what was built

- **`src/lib/legal.ts`**: `OPERATOR`, `TAKEDOWN_DAYS` = 14, `LEGAL_UPDATED` (the "last updated"
  date both pages show; change it with the texts)
- **`LegalPage.svelte`**: the shell — "← Back to the game", the `h1` (`tabindex="-1"`), the date,
  and the prose styles as child selectors, so the routes are plain `h2` / `p` / `ul`. The prose
  is capped at `max-w-2xl` inside the run column
- **The prose is per language in the route** (`{#if de} … {:else} … {/if}`), not in the
  translation table: whole legal paragraphs as table entries would be unreadable. Short labels
  (`footer.*`, `legal.*`) are in the table. The server renders German (the game's default), so a
  crawler gets the binding version of the Impressum
- **The Impressum** has: operator (Medieninhaber), purpose and "Blattlinie" (private,
  non-commercial, no ads, no editorial line — the small-website disclosure under § 25 (5)
  MedienG), the screenshot credit, the takedown, a links disclaimer. No ODR link: the EU's ODR
  platform closed on 20 July 2025. No UID or Firmenbuch: a private operator has neither
- **The privacy page** names Vercel Inc. (Covina, USA; the Data Privacy Framework and the DPA's
  standard contractual clauses for the US transfer), Vercel Blob in Frankfurt, Turso in Ireland,
  the six `localStorage` keys (`STORAGE_KEYS`, under § 165 (3) TKG 2021 as strictly necessary),
  the `geekster_admin` cookie, the GDPR rights and the Austrian DSB. **A new `localStorage` key,
  a cookie, a third-party request or analytics (Sprint 10) must change this page in the same
  commit**
- **The footer** (every page but admin and the brand assets): Impressum · Privacy, then the
  credit on its own line. `footer.poweredBy` is gone. **During a run** (`/`, phase `playing`)
  the two legal links open a new tab (with a screen-reader "(opens in a new tab)"): leaving the
  page would drop the round. The header's wordmark links to `/` off the game's page
- **Checked** (`npm run build && npm run preview`, headless Brave): axe 0 violations on both
  pages and the welcome screen, EN and DE, at 390 and 1280 px, no horizontal overflow, one
  `<title>`; `/impressum` → `/impressum/`; the header link lands on `/`; the footer links'
  targets on the welcome screen and during a run. Driver: `scratchpad/cdp/legal9g.mjs <outDir>`
  and `run9g.mjs` (gitignored)
- **Checked on staging** (2026-09-28, `d820940`): both pages and the welcome screen serve one
  title, one meta description and the footer; no overflow at 390 px; CI green
- **Verified 2026-09-28** against <https://vercel.com/legal/privacy-notice>: the address,
  Vercel's EU-U.S. DPF certification and its use of standard contractual clauses. The texts as a
  whole are still the operator's to check before the release

### Quality bar (every slice)

- `npm run lint && npm run check && npm run test && npm run build` before every push
- Every new label in EN and DE. No hard-coded English in a component
- No colour outside the tokens in the game's components after 9e (a `grep` for `-gray-`,
  `-purple-` … in `src/lib/components/*.svelte` comes back empty)
- Every transition goes through `motion.ts`. Nothing moves with reduced motion on except opacity
- Checked in a real browser at 390 px and 1280 px before a slice is called done

### Definition of done

The new look is released to production. Every screen and state from 9a's list is built from the
tokens and primitives. `/styleguide` shows every primitive in every state. A link sent in WhatsApp
shows the OG image and the pitch. The Impressum and the privacy page are live. The quality pass is
green.
