<!-- Archived verbatim from PLAN.md on 2026-10-10. It describes the project as it was then;
     CLAUDE.md and docs/ describe the present. See docs/history/README.md for the naming. -->

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
| 11e | End-to-end smoke tests (Playwright) for the main flows, in CI on PRs to `main`                  | nothing              | yes                 |
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
  changelog, 2026-10-10). Released in PR #38 (2026-10-10): **Migrate production** green (the
  first `db:check` on production); the user added it as the Deployment Check afterwards

#### 11d — `develop` follows `main` automatically ✅

- `migrate.yml` job **Fast-forward develop**, after **Migrate production**: pushes the migrated
  commit to `develop` if that is a fast-forward, fails with the hand-merge command if `develop`
  has diverged, and then dispatches **Migrate** on `develop` — a `GITHUB_TOKEN` push starts no
  workflow, so a hotfix's migration would otherwise skip staging
- Verified: the step's script against a throwaway repo (equal → no-op, behind → fast-forward,
  diverged → error, `develop` untouched). Released in PR #38 (2026-10-10): **Fast-forward develop**
  green, `develop` at the merge commit `be1bf18`

#### 11e — End-to-end smoke tests ✅

- Playwright in `tests/e2e/` (`npm run test:e2e`), against `vite preview` of the production build
  on a fresh `e2e.db` (migrated, seeded from `games.json`; a card's year comes from its `src`):
  an endless run (1 right, 3 wrong) to GAME OVER and the name prompt; a perfect Daily, its share
  text through the copy fallback (no year in it); a wrong admin password refused, login → 125
  games; axe on welcome, playing and both result screens, and the admin login.
  `.github/workflows/e2e.yml` on pull requests into `main` only (decision 11e-1, the user: no
  nightly). `scratchpad/cdp/` deleted
- Verified locally: 4 tests green, 12/12 with `--repeat-each=3` (three Dailies in parallel on one
  database); green on PR #38 in CI (1m41s). Found on the way: the reveal ignores "Next card" for 300 ms (`NEXT_GUARD_MS`), so
  `placeCard` clicks until the card changes; axe must wait for Svelte's transitions to finish
- [ ] Open, optional: the admin panel fails axe's colour contrast (`text-gray-500` on the dark
      background, 43 uses) and has an empty `<th>` on the games list, so `admin.spec.ts` runs axe
      on the login page only. Recolour to `gray-400`, then add `expectAccessible` to the list

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
- [x] **Sync `develop` after every release, automatically.** Today step 4 of the branching flow
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
- [x] Update `docs/runbooks/schema-migrations.md` (rules 3–4, "applied from a laptop, never
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
