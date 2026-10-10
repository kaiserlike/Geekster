# Geekster — Plan

The current milestone in full, the next ones in outline. Finished milestones live in
`docs/history/` (one file per number, with an index); the product direction and the order of
the milestones are in `ROADMAP.md`; how the project works today is in `CLAUDE.md` and `docs/`.

## Status

- **Production:** Milestone 10, 11a (the database tests) and 11f (the HUD from player feedback)
  are released (PR #37, 2026-10-09); all three databases are at migration `0006`
- **Now:** Milestone 11 — the pipeline: migrations, tests, sync (formerly Sprint 8m). Next is
  11d (the `develop` sync). 11b and 11c are on `develop`, not released
- **Docs restructured 2026-10-04:** `SPRINTS.md` → `PLAN.md` + `docs/`, CLAUDE.md slimmed, new
  rules (`architecture.md`, `testing.md`), `npm run verify`, `/wrap-up`
- **Open hand steps for the user:** after the release that carries 11c, add **Migrate
  production** as a Deployment Check (Vercel → geekster → Settings → Build and Deployment →
  Deployment Checks → Add Checks → GitHub). The check name only exists once the job has run on
  `main`; until it is added, a production deploy races its migration

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

## Milestone 11 — The pipeline: migrations, tests, sync

> Formerly **Sprint 8m** (renumbered 2026-10-04, before any work started). Goal: a release needs
> no manual database or git step, and "migrate before deploy" is enforced by the pipeline instead
> of a PR description. Planned 2026-09-27, after Sprint 8's slice-2 release. Sized as one short
> session. Moved behind Sprint 9 on 2026-09-27 and behind Sprint 10 on 2026-10-02 (the playtest
> made Sprint 10 the priority), so `0004`–`0006` were applied by hand through the runbook.
> **Widened 2026-10-04** (docs review): the referee's database layer has no tests and every UI
> check is a hand-written browser script, so the tests that guard a release join the pipeline
> work (11a, 11e)

### Work packages

| #   | Package                                                                                         | Needs                | Releases on its own |
| --- | ----------------------------------------------------------------------------------------------- | -------------------- | ------------------- |
| 11a | Database integration tests: migrations applied to an in-memory libSQL, the referee's guarantees | nothing              | yes (tests only)    |
| 11b | Staging migrations in GitHub Actions on every push to `develop`, with the integrity checks      | GitHub `staging` env | yes                 |
| 11c | Production migrations before the deploy, and the deploy ordering                                | decision 11-1        | yes                 |
| 11d | `develop` fast-forwarded to `main` after every release, automatically                           | 11c (runs after it)  | yes                 |
| 11e | End-to-end smoke tests (Playwright) for the main flows, in CI                                   | 11a's fixtures       | yes                 |
| 11f | HUD clarity from player feedback: Daily progress squares, the endless streak display            | nothing              | yes                 |

Start with 11a: it needs no decision, and 11b–11d are safer once the database layer is tested.

#### 11a — Database integration tests ✅

- `src/lib/server/testDb.ts` (in-memory libSQL, `drizzle/` applied, seed helpers) and 24 tests
  in `runs.test.ts` / `scores.test.ts`: races on `place` / `next`, second `place` / `bonus` /
  `next`, the bonus deadline ±1 ms, one score per run, the Daily (device id, same set, resume,
  open bonus skipped, two tabs, one per day), the board (best once, week from Monday, ties, own
  row off the page), standing, the Pro gate at 99/100. `./db` is mocked (decision row)
- Verified locally: `npm run verify`; each guarantee broken on purpose (unconditional `save`, no
  `DailyPlayed`, no `ON CONFLICT`, `n >= 1`, `>` for the week) turns its test red. Commit: this one

#### 11f — HUD clarity (player feedback) ✅

- Players read the streak bar as "cards placed". The Daily shows Card N / 10 and a square per
  card; endless runs show a multiplier ladder ×1.0–×1.5 and the first empty heart charging N/10
  (design 2D); the streak is a 🔥 count in both. Commits `3efe03c`, `094383b`, `81a36b1`,
  `d3ec50d`; released in PR #37 (2026-10-09)
- Verified locally with the CDP driver (a Daily with a miss and a mid-run reload; an endless run
  W + 11 R; the styleguide at 390 / 1280 px) and on production (two cards of an unfinished
  endless run, so no score was written; no Daily played there)
- [ ] Open, optional, from the same session's input audit (no injection found): escape `%` / `_`
      in the admin game search (`games.ts`), as `scores.ts` does

#### 11b — Staging migrations in GitHub Actions ✅

- `.github/workflows/migrate.yml`: every push to `develop` (and `workflow_dispatch`) runs
  `db:migrate:staging`, then the new read-only `npm run db:check -- --target=<stage>` (integrity,
  foreign keys, every journal entry recorded with its hash). Never cancelled midway, not gated on
  CI. GitHub environment `staging` (admits only `develop`) holds `TURSO_STAGING_DATABASE_URL` /
  `_AUTH_TOKEN`. The "second run as a no-op" check became `db:check`'s journal comparison, since
  `drizzle-kit migrate` prints the same either way
- Verified: `db:check` green on local and staging; on a broken copy of `local.db` it reports a
  dangling `screenshots` row and a missing `0006` record (exit 1); `drizzle-kit migrate` exits 1
  on a failed migration. The first **Migrate** run on GitHub (`199a4c7`) green: 7 recorded

#### 11c — Production migrations before the deploy ✅

- `migrate.yml` gains **Migrate production**: every push to `main` migrates production and runs
  `db:check`, in the GitHub environment `production-database` (admits only `main`; not
  `Production`, which is Vercel's). The ordering is a **Vercel Deployment Check** on that job, so
  no `VERCEL_TOKEN` in GitHub and 7g stands (decision 11-1). No required reviewer: the merge is the
  approval. `.github/pull_request_template.md` carries the compatibility questions
- Verified: Deployment Checks are offered to every GitHub-connected project (Vercel docs and
  changelog, 2026-10-10). The job itself first runs at the release; the check is a hand step
  (§ Status)

#### 11e — End-to-end smoke tests

- **Goal:** the hand-written CDP scripts are replaced by a small Playwright suite in the repo
- **Tasks:**
  - [ ] Playwright against `npm run build && npm run preview` with a seeded `file:` database
  - [ ] Flows: an endless Normal run to the result screen; a Daily Run to "complete"; share
        (copy fallback); admin login and the games list; axe on each phase
  - [ ] A CI job (separate from `verify`, so local commits stay fast); `npm run test:e2e`
  - [ ] Delete `scratchpad/cdp/` (the hand-written CDP drivers these tests replace)
- **Open (11e-1):** run it on every push, or only on PRs to `main`? Recommendation: PRs to `main`
  and nightly on `develop`, to keep pushes to staging quick

### Why

- Every migration so far (`0001`–`0003`) was applied by hand from a laptop, in an order written
  into the release PR. `0003` showed the order is load-bearing: the new code on the old schema
  serves an empty pool. A step that depends on someone reading a PR description will one day be
  skipped or done in the wrong order
- Not Flyway or Liquibase: Drizzle's migrator already provides versioned SQL, a journal, hash
  checks and a per-database record (`__drizzle_migrations`). What is manual is **who runs it and
  when**, not the tooling

### What stays human

- **The compatibility check.** Every migration must keep the **previous** code working (runbook
  § A migration the running code must survive). With that, "migrate, then deploy" is safe to
  automate; without it, no pipeline helps. It becomes a checklist item in the PR template
- Writing and reviewing the SQL (`db:generate` output is read, rebuilds are hand-written),
  proving a rebuild on a copy of production, and `db:dump` before a risky one

### Tech Tasks

- [x] **Staging:** a job in a GitHub `staging` environment on every push to `develop`:
      `db:migrate:staging`, a second run as a no-op check, then `PRAGMA integrity_check` and
      `foreign_key_check` (foreign keys are off during `migrate()`, see the runbook)
- [x] **Production:** the same, on every push to `main`, in a GitHub `production` environment.
      The Turso production URL and token are secrets of that environment only, so no other
      workflow or branch can read them. Optionally a required reviewer, so a migration waits for
      one click from the owner
- [x] **Ordering — migrate strictly before deploy.** Today Vercel's Git integration deploys the
      moment `main` changes, racing any migration. Proposed: disable Vercel's automatic deploy
      for `main` (`git.deploymentEnabled` in `vercel.json`) and let the workflow run
      `vercel deploy --prod` only after the migration job succeeds. Same for `develop` →
      staging, or accept the race there. Feature-branch previews stay on the Git integration
- [x] **Decision needed (11-1):** this needs a `VERCEL_TOKEN` in GitHub, which reverses the Sprint 7g
      decision ("no `VERCEL_TOKEN` in GitHub — nothing in CI deploys"). Environment-scoped
      secrets and a protected `main` are what would make it acceptable. The alternative that
      keeps 7g intact: Vercel Deployment Checks, where the deploy waits for a GitHub check —
      verify whether the Hobby plan offers them before choosing. **Decided 2026-10-10:**
      Deployment Checks — available to every GitHub-connected project
- [x] A failed migration fails the workflow, so nothing deploys. The live app keeps running on the
      old code, which the compatibility rule guarantees still works
- [ ] **Sync `develop` after every release, automatically.** Today step 4 of the branching flow
      (`git merge --ff-only origin/main` on `develop`) is done by hand. The release PR's merge
      commit exists only on `main`, and a hotfix merged into `main` never reaches `develop`
      until someone remembers. Proposed: a job on every push to `main` that fast-forwards
      `develop` to `main` and pushes (`permissions: contents: write`, the built-in
      `GITHUB_TOKEN`). A fast-forward is not a force push, so `develop`'s protection allows it.
      **Only ever a fast-forward:** if `develop` has commits `main` lacks (committed after the
      PR was merged), the job fails visibly and a human merges. It never makes a merge commit and
      never resolves a conflict on its own. Known side effects, both harmless: a push made with
      `GITHUB_TOKEN` starts no other workflow, so CI does not re-run on `develop` for code it
      already checked; Vercel still rebuilds staging from the identical tree. If the
      production-migration job exists by then, run the sync after it, so `develop` is never
      ahead of a migration that failed
- [ ] Update `docs/runbooks/schema-migrations.md` (rules 3–4, "applied from a laptop, never
      from CI"), `docs/runbooks/release.md` (branching step 4 and the hotfix line become
      "automatic, unless the job fails"), the migration invariant in `CLAUDE.md`, and `ci.yml`'s
      comment

### Deliberately not

- **Migrations in the Vercel build command** (`drizzle-kit migrate && vite build`). It looks
  simpler and orders itself, but every feature-branch preview would migrate the shared staging
  database, and a build that fails after migrating leaves them out of step
- **Database dumps as CI artifacts.** The repository is public. Turso's point-in-time restore is
  the pipeline's safety net; the manual `db:dump` stays for anything risky
- **Down-migrations.** Unchanged from 7h: fix forward

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
