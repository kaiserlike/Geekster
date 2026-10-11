# Geekster — Plan

The current milestone in full, the next ones in outline. Finished milestones live in
`docs/history/` (one file per number, with an index); the product direction and the order of
the milestones are in `ROADMAP.md`; how the project works today is in `CLAUDE.md` and `docs/`.

## Status

- **Production:** Milestone 11 is released (PR #37 2026-10-09, PR #38 2026-10-10). All three
  databases are at migration `0006`. The pipeline is live: staging and production migrate in
  GitHub Actions, Vercel holds the production deploy for **Migrate production**, `develop`
  follows `main`, and the e2e suite runs on PRs into `main`
- **Now:** Milestone 12 — Encyclopedia foundation, cut into 12a–12f (2026-10-11). Next: 12a,
  language routing and the years index
- **Open hand steps for the user:** none recorded. Optional: make **End-to-end tests** a required
  check on `main`

## How this file works

- **Milestone** = a numbered theme with a goal (`11`). **Work package** = one releasable part of
  it (`11a`, `11b` …). Numbers 1–10 were called sprints; same thing, see
  `docs/history/README.md`. IDs are never reused or renumbered once work has started
- A milestone is cut into work packages at its start, each with: goal, acceptance criteria,
  tasks, open decisions (with a recommendation), verification
- A finished work package stays here, folded to a few lines (done, commit, how verified), until
  its milestone is released
- When the milestone is released, its whole section moves to `docs/history/NN-name.md` in one
  commit, word for word, and gets a row in the history index

---

## Open from earlier milestones

Small, optional, not part of a milestone yet; pick up when touching the area.

- [ ] Escape `%` / `_` in the admin game search (`games.ts`), as `scores.ts` does (11f's input
      audit; no injection found)
- [ ] The admin panel fails axe's colour contrast (`text-gray-500` on the dark background, 43
      uses) and has an empty `<th>` on the games list, so `tests/e2e/admin.spec.ts` runs axe on
      the login page only. Recolour to `gray-400`, then add `expectAccessible` to the list (11e)

---

## Milestone 12 — Encyclopedia foundation (phase E1)

> Formerly Sprint 11. Goal: "What came out in 1998?", answered on a page search engines can
> read, with a Play button. Cut into work packages on 2026-10-11

The long-term plan, the data-source decisions (Wikidata as the CC0 backbone; not IGDB or
MobyGames) and the SEO reasoning are in `ROADMAP.md` § "The encyclopedia".

### Decisions made while planning (2026-10-11, with the user)

- **12-1 URLs:** `/de/jahre/1998` and `/en/years/1998`. Both languages carry a prefix, the path
  segments are localised through a `reroute` hook onto one route tree
  (`src/routes/[lang=locale]/years/…`), every page has `hreflang` de / en / `x-default` (→ en).
  The game at `/` keeps its client-side switch
- **12-2 Images:** an own cover per game (`games.cover_url`), picked from RAWG's
  `background_image` (key art) and stored as WebP in the blob store. Encyclopedia pages read only
  the cover, never a screenshot, so no search gives the Daily away
- **12-3 Year texts** live in the repo for now (`src/lib/content/years.ts`, drafted by Claude,
  reviewed by the user in the diff). **They move into the admin panel in E2**, with the events
  CMS (`ROADMAP.md` § Phases)
- **12-4 Ranged runs** ("Play 1998") are Normal only and unranked: no score row, no global or
  local board; the result screen and sharing stay

### Constraint found while planning

The locale is a module-level rune (`i18n.svelte.ts`). On the server, module state is shared by
every request, so **the URL's language is never set with `setLocale()` on the server**. The
translation table moves to a plain module with a pure `translate(locale, key, …)`; server-rendered
pages translate with the locale from the URL, `ts()` & co. stay wrappers around the client's rune.

### Work packages

| #   | Package                                                                     | Needs    | Releases on its own |
| --- | --------------------------------------------------------------------------- | -------- | ------------------- |
| 12a | Language routing, `hreflang`, and the years index (`/de/jahre/`)            | nothing  | yes                 |
| 12b | `platforms` table, hand-curated seed, admin CRUD                            | nothing  | yes                 |
| 12c | Cover images: columns, admin picker, a fill script                          | nothing  | yes (admin only)    |
| 12d | Year pages: our games with covers, platform launches, our own text          | 12a–12c  | yes                 |
| 12e | "Play 1998" / "Play the 90s": a year range on `POST /api/runs`              | 12d      | yes                 |
| 12f | Sitemap, `schema.org`, the per-screenshot RAWG credit, links into the pages | 12d, 12e | yes                 |

Start with 12a: every later page is built on it. 12b and 12c are independent of each other.

#### 12a — Language routing and the years index

**Goal:** `/de/jahre/` and `/en/years/` are rendered on the server in the URL's language, with
`hreflang` and a canonical URL, and list every year that has live games.

**Acceptance criteria**

- The SSR HTML of `/en/years/` has `<html lang="en">`, no German text (header and footer
  included), `hreflang` links to both languages and `x-default`, and its own title and
  description; `/de/jahre/` likewise in German
- A wrong segment for the language (`/de/years/`, `/en/jahre/`) answers 301 to the right one
- On these pages the language switch is a link to the other language's URL; arriving on a
  language URL makes that the game's language too (in the browser only)
- The game at `/` behaves exactly as before

**Tasks**

- [ ] `src/lib/i18n/translations.ts`: the table and a pure `translate(locale, key, …)`;
      `i18n.svelte.ts` keeps its API on top (also splits the outlier noted in `architecture.md`)
- [ ] `src/lib/localizedPaths.ts` (pure, tested): `localizedPath(locale, route, params)` and the
      way back; `src/hooks.ts` `reroute`; `src/params/locale.ts`
- [ ] `hooks.server.ts`: `<html lang>` from the prefix; the 301 for a wrong segment
- [ ] Root layout: header and footer translate with `page.params.lang ?? getLocale()`;
      `LangSwitch` as a link on localised pages
- [ ] `SeoHead.svelte`: title, description, canonical, `hreflang`, `og:*` per page (the layout's
      static English OG set stays the fallback for the game)
- [ ] `src/lib/server/encyclopedia.ts` (`fn(db, …)`): years with live games, grouped by decade;
      the index page `src/routes/[lang=locale]/years/+page.server.ts` / `+page.svelte`
- [ ] Docs: `frontend.md` (i18n, `<html lang>`, SEO head), `project-structure.md`,
      `game-architecture.md` if the data flow section names the locale

**Verification:** unit tests for `localizedPaths` and `translate`; an integration test of the
years query against `freshDb()` (drafts and games without a primary excluded); `curl` of both
languages' SSR HTML (lang, `hreflang`, canonical, no German on `/en`); axe in the e2e suite.

#### 12b — Platforms

**Goal:** a `platforms` table the year pages can read, maintained in the admin panel.

**Acceptance criteria**

- `platforms` (`id`, `slug` unique, `name`, `manufacturer`, `launch_year`) exists on all three
  stages through migration `0007`
- About 40 consoles, handhelds and PC milestones are seeded from a hand-curated
  `src/lib/data/platforms.json`; seeding twice changes nothing
- `/admin/platforms` lists, creates, edits and deletes platforms; linked from the admin nav

**Tasks**

- [ ] Schema + `db:generate` → `0007_platforms`, reviewed, `db:migrate`, `db:check`
- [ ] `platforms.json` and a seed script with `--target=` (`scripts/db-target.js`) and
      `--dry-run`, upserting by slug
- [ ] `src/lib/server/platforms.ts` (`fn(db, …)`), tests against `freshDb()` (duplicate slug,
      launch year bounds)
- [ ] Admin pages with form actions, as `admin/games` does; input parsed at the boundary
- [ ] Docs: `admin-panel.md`, `project-structure.md`, `README.md` / `CLAUDE.md` command table
      for the seed script

**Verification:** `npm run verify`; the seed against local twice (second run a no-op); the
admin flow by hand locally, then on staging after the migration ran in CI.

#### 12c — Cover images

**Goal:** every game can have a cover that only the encyclopedia shows.

**Acceptance criteria**

- Migration `0008` (expand only) adds `games.cover_url`, `games.cover_source_url`,
  `games.rawg_slug`; the previous code keeps working
- The admin game page has a Cover section: RAWG picker or a local file, 16:9 crop, WebP, one
  upload; replacing a cover deletes the old blob of the same stage; picking from RAWG stores the
  game's `rawg_slug`. The games list shows a "no cover" badge
- `scripts/fill-covers.js --target= --dry-run` takes RAWG's `background_image` only for an
  unambiguous match (name and year) and leaves the rest for the admin
- No player-facing API ever returns a cover (a test on the run responses)

**Tasks**

- [ ] Schema + `0008_game_covers`; `games.ts` functions for the cover; a `?/cover` action
- [ ] Reuse `RawgPicker`, `ScreenshotCropper`, `imageEncode.ts`; blob names stay
      `screenshots/<32 hex>.webp` (or `covers/…`, same rule: never the game's name)
- [ ] The fill script; run against production, then `db:refresh-staging` — check that it copies
      the new columns first
- [ ] Docs: `admin-panel.md`, `adding-games.md`, `environments.md` (blob), `project-structure.md`

**Verification:** `npm run verify`; the script's `--dry-run` output reviewed before the real
run; covers checked on a handful of games in the admin; the run-response test broken on purpose.

#### 12d — Year pages

**Goal:** `/en/years/1998` and `/de/jahre/1998` show our games of that year with their covers,
the platforms launched that year and a short text of our own.

**Acceptance criteria**

- A year page exists for every year with at least one live game or platform launch; any other
  year answers 404
- A page is indexable only when it has its own text; otherwise it carries `noindex, follow`
- Each game links to its RAWG page when `rawg_slug` is known; the page carries the RAWG credit
- Previous / next year and the decade are linked; the page sets `Cache-Control: s-maxage`
- The page never contains a screenshot URL (a test)

**Tasks**

- [ ] Pure rules in `src/lib/encyclopedia.ts` (year param, page exists, indexable) with tests
- [ ] `encyclopedia.ts` (server): the year's games and launches, tested against `freshDb()`
- [ ] Route `src/routes/[lang=locale]/years/[year]/`, built on the design system
- [ ] `src/lib/content/years.ts`: EN/DE texts for every year with games, drafted by Claude from
      facts (no Wikipedia text, CC BY-SA), reviewed by the user
- [ ] Docs: `game-rules.md` (what the encyclopedia shows and why no screenshots),
      `frontend.md`, `project-structure.md`

**Verification:** unit and integration tests; `curl` a year with text, one without (noindex)
and one without games (404); 390 / 1280 px by hand; axe.

#### 12e — "Play 1998" / "Play the 90s"

**Goal:** a year page starts a run drawn only from that year or decade.

**Acceptance criteria**

- `POST /api/runs` accepts `from` / `to` (integers, `from ≤ to`, at most 10 years apart) with
  `mode: 'normal'` only; Pro or Daily with a range answers 400
- Only live Normal games inside the range are dealt; fewer than `MIN_RANGE_GAMES` (10, in
  `modes.ts`) answers 409 `RangeTooSmall`
- A ranged run writes no score and gets no standing (12-4)
- `/?from=1990&to=1999` shows a range card on the welcome screen with Start and Remove; a
  restart keeps the range; the result screen shows no board and asks for no name; the share text
  names the range; the local lists leave ranged runs out
- A year page shows "Play 1998" from `MIN_RANGE_GAMES` games, otherwise "Play the 1990s" when
  the decade has enough, using the same count as the server

**Tasks**

- [ ] `yearRange()` parser at the boundary; `0009_run_range` (`runs.year_from`, `year_to`)
- [ ] `selectLiveGames(mode, range?)` / `countLiveGames` in `liveGames.ts`; `createRun`,
      `finishRun`, `toRecord`
- [ ] Client: `gameState.range`, welcome range card, result screen, `share.ts` (+ tests)
- [ ] Tests in `runs.test.ts`: only in-range games, the 9 / 10 boundary, no score row, Pro with
      a range refused; an e2e step: year page → Play → a ranged run to the result screen
- [ ] Docs: `game-rules.md`, `game-architecture.md` (the referee's call table), `README.md`
      (API routes)

**Verification:** `npm run verify`; the boundary and no-score tests broken on purpose; the e2e
suite; one ranged run on staging.

#### 12f — Sitemap, schema.org, credits, ways in

**Goal:** search engines find the indexable pages, and players find the encyclopedia.

**Acceptance criteria**

- `/sitemap.xml` lists every indexable page in both languages with `xhtml:link` alternates;
  `robots.txt` names it and disallows `/admin/` and `/styleguide/`
- A year page carries JSON-LD: an `ItemList` of `VideoGame` and a `BreadcrumbList`
- The per-screenshot credit (deferred from 9g): the answer that reveals a card's name and year
  also carries its `rawgSlug`, never earlier; the revealed card shows "Image: RAWG" linking to
  the game's RAWG page (rawg.io when unknown)
- The footer links to the years index; a revealed year on the result screen links to its page
- The privacy page is checked: no new key, cookie or third-party request expected

**Tasks**

- [ ] `src/routes/sitemap.xml/+server.ts`, `static/robots.txt`
- [ ] JSON-LD in the year page's head
- [ ] Reveal payload + card credit, with a referee test that a dealt card carries no slug
- [ ] Footer and result-screen links; i18n keys
- [ ] Docs: `frontend.md` (SEO, credit), `game-architecture.md`, `project-structure.md`

**Verification:** `npm run verify`; the sitemap validated against the schema; Google's Rich
Results Test on a staging year page (via a share link); the e2e suite with axe on both language
variants of a year page.

---

## Milestone 13 — Playing together

> Formerly Sprint 12. Goal: Geekster at a game night

> Goal: Geekster at a game night

### 13a — Party mode (pass-and-play)

- [ ] US-13.1: As a group, we play on one device. 2–6 players take turns on one shared timeline,
      and the first to 10 correct placements wins (the 10-placement goal lives on here)
- [ ] No new infrastructure: client-side state only, the same pool and modes

### 13b — Real-time multiplayer (only if party mode shows the demand)

- [ ] US-13.2: As a player, I can create a room and share a code or link
- [ ] US-13.3: As a player, I can join a room with a code
- [ ] US-13.4: As players, we take turns on a shared timeline and see each other's turns and
      scores in real time
- [ ] US-13.5: As a player, I see a final results screen comparing all players

| Component              | Choice                                         | Rationale                                             |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| **Real-time**          | **PartyKit** or **Cloudflare Durable Objects** | Managed WebSocket infrastructure, free tier available |
| **Session management** | Server-side room state                         | Prevents cheating, single source of truth             |

- [ ] Infrastructure: room creation and joining, WebSocket connection management
- [ ] Game logic: server-side turn management, shared state sync, optional turn timer, scoring per
      player (reuses the referee from Milestone 10)
- [ ] UI: room create / join, player list, turn indicator, live scores, results screen
