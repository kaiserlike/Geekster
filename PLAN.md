# Geekster — Plan

The current milestone in full, the next ones in outline. Finished milestones live in
`docs/history/` (one file per number, with an index); the product direction and the order of
the milestones are in `ROADMAP.md`; how the project works today is in `CLAUDE.md` and `docs/`.

## Status

- **Production:** Milestone 11 is released (PR #37 2026-10-09, PR #38 2026-10-10); 12a and 12c
  (PR #39), the crop warning (PR #40, 2026-10-11), the consolation and the result's tally
  (PR #41, 2026-10-19, player feedback). All three databases are at migration `0008`. The
  pipeline is live: staging and production migrate in GitHub Actions, Vercel holds the
  production deploy for **Migrate production**, `develop` follows `main`, and the e2e suite runs
  on PRs into `main`
- **Now:** Milestone 12 — Encyclopedia foundation, cut into 12a–12e (2026-10-11). Next: 12b
  (platforms); 12a and 12c are done and released (PR #39)
- **Between milestones (2026-10-19, user):** 54 new games from 2000–2026 (two per year) are on
  production and staging as **drafts** with a Normal shot; the admin list keeps its filter
  through a game (§ Between milestones). Not released yet: the admin change is on `develop`
- **Open hand steps for the user:** review the 54 drafts (`/admin/games?status=draft`) and
  publish them. Optional: make **End-to-end tests** a required check on `main`

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

## Between milestones (2026-10-19, user)

- [x] ✅ **54 new games, 2000–2026, two per year, as drafts on production** (ids 302–355; staging
      refreshed). Chosen with the user for genre variety (fewer racing games, one Assassin's
      Creed). Each has a Normal primary from RAWG, cropped 16:9 through `/admin/games/new`, every
      final image checked for titles, logos and watermarks (cropped around a corner logo where
      needed). Valheim was dropped: its full release is 2026 (year = first full release)
- [x] ✅ **Admin navigation:** a "Filtered" bar with chips and Reset on the list and a game's page;
      prev/next stay in the filtered set when a game leaves it; back lands on the game's row;
      ← / → / Esc on a game's page. Unit tests (`adminList`, `adminShortcuts`) and an e2e step;
      checked locally and on staging (`98a012e`: filter bar, ← / → / Esc, a
      draft published and unpublished kept the arrows in the drafts, back to the row, reset)
- [ ] The user reviews the 54 drafts and publishes them; Pro shots and covers are still missing
      (`covers:fill` can do the covers)

## Open from earlier milestones

Small, optional, not part of a milestone yet; pick up when touching the area.

- [ ] Escape `%` / `_` in the admin game search (`games.ts`), as `scores.ts` does (11f's input
      audit; no injection found)
- [ ] The admin panel fails axe's colour contrast (`text-gray-500` on the dark background, 43
      uses) and has an empty `<th>` on the games list, so `tests/e2e/admin.spec.ts` runs axe on
      the login page only. Recolour to `gray-400`, then add `expectAccessible` to the list (11e)

---

## Milestone 12 — Encyclopedia foundation (phase E1)

> Formerly Sprint 11. Goal: "What happened in gaming in 1998?", answered on a page search
> engines can read: an information library, one page per year, starting with the 1990s. Cut into
> work packages on 2026-10-11

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
- **12-3 Year texts** live in the repo for now (`src/lib/content/years.ts`: an intro, fun facts,
  what changed in technology, per language; drafted by Claude from facts, reviewed by the user in
  the diff). **They move into the admin panel in E2**, with the events CMS (`ROADMAP.md` §
  Phases)
- **12-4 No Play button in M12.** A single year cannot be played: equal years are always correct
  (`placement.ts`), so a one-year deck cannot be lost, and exact release dates are neither stored
  nor the game's rule. "Play the decade" works with today's rules and pool (every decade from the
  1980s has 40+ live games) and moves to a later milestone (`ROADMAP.md` § Later)
- **12-5 Content drives the pages.** A year page exists only once its text is written; without
  it, 404, never a thin page. Our live games of that year are a list on the page, with no
  minimum. The first release covers **1990–1999**; further decades follow one at a time

### Constraint found while planning

The locale is a module-level rune (`i18n.svelte.ts`). On the server, module state is shared by
every request, so **the URL's language is never set with `setLocale()` on the server**. The
translation table moves to a plain module with a pure `translate(locale, key, …)`; server-rendered
pages translate with the locale from the URL, `ts()` & co. stay wrappers around the client's rune.

### Work packages

| #   | Package                                                                     | Needs   | Releases on its own |
| --- | --------------------------------------------------------------------------- | ------- | ------------------- |
| 12a | Language routing, `hreflang`, and the years index (`/de/jahre/`)            | nothing | yes                 |
| 12b | `platforms` table, hand-curated seed, admin CRUD                            | nothing | yes                 |
| 12c | Cover images: columns, admin picker, a fill script                          | nothing | yes (admin only)    |
| 12d | Year pages for 1990–1999: our text, platform launches, our games            | 12a–12c | yes                 |
| 12e | Sitemap, `schema.org`, the per-screenshot RAWG credit, links into the pages | 12d     | yes                 |

Start with 12a: every later page is built on it. 12b and 12c are independent of each other.

#### 12a — Language routing and the years index ✅

- `/de/jahre/` and `/en/years/` render on the server in the URL's language: header and footer
  included, `<html lang>`, canonical, `hreflang` de / en / `x-default`, own title and description
  (`SeoHead.svelte`, `src/lib/seo.ts`). The table moved to `src/lib/i18n/translations.ts`
  (pure `translate()`); `i18n.svelte.ts` reads `page.params.lang` before the player's choice, so
  nothing is set on the server. `src/lib/localizedPaths.ts` + `reroute` (`src/hooks.ts`) + the
  `locale` matcher; a wrong segment answers 301; `LangSwitch` is a link there; arriving on a
  language URL sets the player's language in the browser. The index lists the written years by
  decade with their live-game count (`src/lib/server/encyclopedia.ts`), `noindex` and an empty
  state while none is written; CDN cache one hour
- Verified: unit tests (`localizedPaths`, `encyclopedia`), an integration test of the count
  (drafts, no primary, Pro only, both tiers once; broken on purpose: red); with two temporary
  entries on the dev server, `curl` of both languages (lang, hreflang, canonical, no German on
  `/en`, 301s, 308 for the missing slash, 404 for `/fr/years/` and `/de/`) and a browser run
  (switch by link, footer in English, the game afterwards in English, no console errors); new
  `tests/e2e/encyclopedia.spec.ts` (axe on both languages) and the whole e2e suite green

#### 12b — Platforms

**Goal:** a `platforms` table the year pages can read, maintained in the admin panel.

**Acceptance criteria**

- `platforms` (`id`, `slug` unique, `name`, `manufacturer`, `launch_year`) exists on all three
  stages through migration `0008`
- About 40 consoles, handhelds and PC milestones are seeded from a hand-curated
  `src/lib/data/platforms.json`; seeding twice changes nothing
- `/admin/platforms` lists, creates, edits and deletes platforms; linked from the admin nav

**Tasks**

- [ ] Schema + `db:generate` → `0008_platforms`, reviewed, `db:migrate`, `db:check`
- [ ] `platforms.json` and a seed script with `--target=` (`scripts/db-target.js`) and
      `--dry-run`, upserting by slug
- [ ] `src/lib/server/platforms.ts` (`fn(db, …)`), tests against `freshDb()` (duplicate slug,
      launch year bounds)
- [ ] Admin pages with form actions, as `admin/games` does; input parsed at the boundary
- [ ] Docs: `admin-panel.md`, `project-structure.md`, `README.md` / `CLAUDE.md` command table
      for the seed script

**Verification:** `npm run verify`; the seed against local twice (second run a no-op); the
admin flow by hand locally, then on staging after the migration ran in CI.

#### 12c — Cover images ✅

- Migration `0007_game_covers` (expand only): `games.cover_url`, `cover_source_url`, `rawg_slug`.
  The game page's Cover section (`CoverPanel.svelte`): a file or RAWG's key art (`RawgPicker`
  `kind="cover"`), cropped and encoded like every image, to `?/cover`; replace / remove delete the
  old blob; a RAWG pick stores `rawg_slug`. The key art is no longer offered as a screenshot, and
  `?/cover` refuses an image a screenshot was cut from (`isPuzzleSource()`). `NO COVER` chip and
  `?missing=cover`. `npm run covers:fill` (unambiguous name + year matches, centre crop, WebP
  ≤ 1600×900, conditional write; local and production only)
- Verified: unit tests (`covers`, the filter), integration tests (`games.test.ts`: set, replace,
  slug kept, remove, delete returns the cover, the list filter; `runs.test.ts`: no referee answer
  carries a cover — a name set to the cover URL turns it red); `db:migrate` + `db:check` local;
  `covers:fill` against local (dry run of 8, a real one: a 640×360 WebP under `staging/`); in the
  browser: list filter, cover shown, remove (blob gone per `head()`), a RAWG key-art pick saved,
  and the refusal when a screenshot shares the source
- [x] Released with 12a in PR #39 (`0007` on production). `covers:fill` against production
      (2026-10-11, after the user reviewed the dry run): 239 of 298 games filled, 59 left for the
      panel (57 without a RAWG match by name and year, 2 with two). To check by eye in the panel,
      a re-release's key art is likely: Spyro the Dragon, Jet Set Radio, Animal Crossing: New
      Horizons, Hades
- [x] `db:refresh-staging` (2026-10-11): staging has production's covers
- [ ] **Open, the user's step, before 12d:** the 59 covers by hand in the panel

#### 12d — Year pages, the 1990s

**Goal:** `/en/years/1998` and `/de/jahre/1998` tell what happened in gaming that year: our own
intro, fun facts, what changed in technology, the platforms launched, and our games of that year
with their covers. All ten years of the 1990s, in both languages.

**Acceptance criteria**

- A year page exists exactly when its text exists (12-5); any other year answers 404, and the
  years index lists only those
- Our live games of the year are listed with their covers (none is fine); each links to its
  RAWG page when `rawg_slug` is known; the page carries the RAWG credit
- Previous / next year (of the written ones) and the decade are linked; the page sets
  `Cache-Control: s-maxage`
- The page never contains a screenshot URL (a test)

**Tasks**

- [ ] Pure rules in `src/lib/encyclopedia.ts` (year param, page exists, neighbours) with tests
- [ ] `encyclopedia.ts` (server): the year's games and launches, tested against `freshDb()`
- [ ] Route `src/routes/[lang=locale]/years/[year]/`, built on the design system
- [ ] `src/lib/content/years.ts`: 1990–1999 in EN and DE, drafted by Claude from facts (no
      Wikipedia text: CC BY-SA), reviewed by the user
- [ ] Docs: `game-rules.md` (what the encyclopedia shows and why no screenshots),
      `frontend.md`, `project-structure.md`

**Verification:** unit and integration tests; `curl` a written year (200, both languages) and
an unwritten one (404); 390 / 1280 px by hand; axe.

#### 12e — Sitemap, schema.org, credits, ways in

**Goal:** search engines find the indexable pages, and players find the encyclopedia.

**Acceptance criteria**

- `/sitemap.xml` lists every year page and the index in both languages with `xhtml:link` alternates;
  `robots.txt` names it and disallows `/admin/` and `/styleguide/`
- A year page carries JSON-LD: an `ItemList` of `VideoGame` and a `BreadcrumbList`
- The per-screenshot credit (deferred from 9g): the answer that reveals a card's name and year
  also carries its `rawgSlug`, never earlier; the revealed card shows "Image: RAWG" linking to
  the game's RAWG page (rawg.io when unknown)
- The footer links to the years index; a revealed year on the result screen links to its page
  when that page exists
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
