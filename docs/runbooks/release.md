# Deployment, CI and releases

- **Deploys come from Vercel's Git integration, not from a workflow.** Push to `main` builds
  Production and aliases it to geekster.pro; push to `develop` builds Preview and aliases it to
  staging.geekster.pro; any other branch gets a throwaway preview URL. No `VERCEL_TOKEN` is stored
  in GitHub — nothing in CI deploys
- **`.github/workflows/migrate.yml` migrates** staging on every push to `develop` and production
  on every push to `main`, then runs `db:check` (`docs/runbooks/schema-migrations.md` § The
  sequence). Its job **Migrate production** is a Vercel Deployment Check: a production build
  waits for it before it is aliased to geekster.pro, so the schema always lands first
- **`.github/workflows/ci.yml` is the quality gate Vercel does not provide.** It runs `npm ci`,
  `lint`, `format:check`, `check`, `test` and `build` on every pull request and on pushes to `main`
  and `develop`. Vercel only ever runs `vite build`, which neither lints, type-checks `.svelte`
  files nor runs the tests. The workflow needs no secrets: the database client is lazy and reads
  `$env/dynamic/private` at request time
- **`main` is protected** — pull request required, CI must pass, no force pushes or deletions.
  **`develop` refuses force pushes and deletions only** — no PR, no required check
- **Branching (since 2026-09-26): work happens on `develop` directly.** Solo project, so a
  feature-branch PR into `develop` was a review with nobody on the other side. The one review is
  the release PR:
  1. Commit on `develop`, test locally. Run `npm run verify` before pushing —
     CI on `develop` runs after the push, so a red run means staging is already broken
  2. Push → staging.geekster.pro, and the **Migrate** workflow applies any migration; test there
  3. PR `develop` → `main` (the template's migration questions answered), review, merge. The
     merge migrates production; geekster.pro switches once **Migrate production** is green
  4. **Sync back:** `git checkout develop && git merge --ff-only origin/main && git push`. The
     release merge commit exists only on `main`; this is always a clean fast-forward
- **Everything on `develop` ships together.** There is no partial release, so release small and
  often — per work package, not per milestone. A migration waiting on staging holds up every release
  behind it
- **A milestone may be released as one update** instead of per work package, when its packages
  only make sense together (Milestones 9 and 10 were). That is decided per milestone and written
  into its section in `PLAN.md`; meanwhile a production fix goes `hotfix/*` off `main`
- **Branches are the exception:** a short-lived `feature/*` off `develop` for large or
  experimental work that might be abandoned (e.g. a migration milestone), or when
  several Claude sessions work in parallel. A production fix that cannot wait for `develop` goes
  `hotfix/*` off `main` → PR → `main`, then `git merge origin/main` into `develop`

## After a release

The release PR's description lists what ships, the migrations and their order. After the merge:
the production checks, a line in `CHANGELOG.md`, and — once the milestone is complete — its
section in `PLAN.md` moves to `docs/history/` (see `/wrap-up`).
