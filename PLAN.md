# Geekster — Plan

The current milestone in full, the next ones in outline. Finished milestones live in
`docs/history/` (one file per number, with an index); the product direction and the order of
the milestones are in `ROADMAP.md`; how the project works today is in `CLAUDE.md` and `docs/`.

## Status

- **Production:** Milestone 11 is released (PR #37 2026-10-09, PR #38 2026-10-10). All three
  databases are at migration `0006`. The pipeline is live: staging and production migrate in
  GitHub Actions, Vercel holds the production deploy for **Migrate production**, `develop`
  follows `main`, and the e2e suite runs on PRs into `main`
- **Now:** Milestone 12 — Encyclopedia foundation. Not cut into work packages yet; its first task
  is the i18n routing decision
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
> read, with a Play button

The long-term plan, the data-source decisions (Wikidata as the CC0 backbone; not IGDB or
MobyGames) and the SEO reasoning are in `ROADMAP.md` § "The encyclopedia". Planned in detail at
milestone start. The outline:

- [ ] **Decide the i18n routing first.** The game's language switch is client-side. Server-rendered
      pages need the language in the URL (`/de/…`) plus `hreflang`
- [ ] `/years/[year]`, rendered on the server: our published games of that year, the platforms
      launched that year, and a short text of our own
- [ ] **"Play this year" / "Play this decade"**: a deck, a range (`from`, `to`) on `POST /api/runs`
- [ ] `platforms` table (name, manufacturer, launch year), seeded by hand, with admin CRUD
- [ ] **Encyclopedia pages never show a puzzle screenshot**, or a single search would give the
      Daily away. They need cover art or a second, non-primary image, so decide the image source
- [ ] `sitemap.xml`, `schema.org` `ItemList` / `VideoGame`, internal links between years
- [ ] The RAWG link stays on every page that uses RAWG data (their terms)
- [ ] The per-screenshot RAWG credit deferred from 9g (only the global credit is live)

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
