# Geekster

A timeline guessing game for video game screenshots: players place screenshots in chronological
order by release year — Hitster, with video games. Live at <https://geekster.pro>.

This file is loaded into every session, so it holds only what every session needs: the stack, the
commands, the conventions and the invariants. Everything else is one link away. **Keep it under
250 lines** (the docs hook enforces it); detail belongs in `docs/`.

## Where things are

| Need                                                 | Read                                      |
| ---------------------------------------------------- | ----------------------------------------- |
| What to work on now                                  | `PLAN.md` § Status, then the milestone    |
| Why the product is going where it goes               | `ROADMAP.md`                              |
| Why something is the way it is                       | `docs/decisions.md`, then `docs/history/` |
| What shipped when                                    | `CHANGELOG.md`, `docs/history/README.md`  |
| Every file and what it does                          | `docs/architecture/project-structure.md`  |
| The game's rules (modes, scoring, Daily, board …)    | `docs/architecture/game-rules.md`         |
| Code flow: state machine, the referee, key functions | `docs/architecture/game-architecture.md`  |
| Design system, accessibility, legal pages            | `docs/architecture/frontend.md`           |
| The admin panel                                      | `docs/architecture/admin-panel.md`        |
| Stages, secrets, blob store, access protection       | `docs/runbooks/environments.md`           |
| Branching, CI, releasing                             | `docs/runbooks/release.md`                |
| Changing the schema                                  | `docs/runbooks/schema-migrations.md`      |
| Adding games                                         | `docs/runbooks/adding-games.md`           |
| How to write code, tests and docs here               | `.claude/rules/`                          |

**Naming:** numbers 1–10 were called sprints, from 11 on milestones; a letter suffix (`10c`,
`11a`) is a work package. IDs are never reused or renumbered once work has started (8m was
renumbered to 11 before it started). Details: `docs/history/README.md`.

## Tech stack

- **SvelteKit** (Svelte 5 runes), **TypeScript** strict, **Tailwind CSS v4** with the design tokens
  in `src/app.css` `@theme` and primitives in `src/lib/components/ui/` (`/styleguide` shows them).
  Fonts self-hosted via `@fontsource`. `bits-ui` for dialogs only
- **Backend:** SvelteKit API routes (`src/routes/api/`), server-only code in `src/lib/server/`
- **Database:** Turso (libSQL) via Drizzle ORM — the single source of truth. `games.json` is seed
  data, never a runtime fallback. Schema history in `drizzle/`
- **Images:** Vercel Blob, public store `geekster-screenshots` (fra1); the DB holds absolute URLs
- **Hosting:** Vercel (`adapter-vercel`), functions in `dub1` next to Turso (`aws-eu-west-1`).
  `main` → geekster.pro, `develop` → staging.geekster.pro, other branches → previews
- **i18n:** own reactive EN/DE system (`i18n.svelte.ts`) for the game; the admin panel is English
- **Admin auth:** `ADMIN_PASSWORD` + an HMAC-signed 12-hour session cookie
- **Tests:** Vitest, `src/lib/**/*.test.ts`, node environment; Playwright in `tests/e2e/`.
  **CI:** `.github/workflows/ci.yml`; `migrate.yml` migrates staging on push to `develop`,
  production on push to `main`; `e2e.yml` on pull requests into `main`

## Code map

```
src/lib/*.ts              pure rules and helpers (placement, scoring, crop, daily, share …) + their tests
src/lib/*.svelte.ts       rune-based client state (game.svelte.ts, i18n, player, drag, ruler)
src/lib/server/           server-only: db, schema, the referee (runs.ts + pure runRules.ts), daily,
                          scores, games CRUD, blob, auth, rawg, stats
src/lib/components/       game components; ui/ = design-system primitives; admin/ = admin panel
src/routes/               / (the game), /leaderboard, /impressum, /privacy, /styleguide, /admin/**,
                          api/ (runs, daily, scores, share, admin/*)
src/hooks.server.ts       admin guard, noindex outside production, <html lang>
tests/e2e/                Playwright smoke tests (play.ts: placing cards, axe)
drizzle/                  versioned migrations — never reformat (.sql bytes are hashed)
scripts/                  db and blob tooling run from the laptop
docs/                     architecture, runbooks, decisions, history
scratchpad/               gitignored working area for agents: temporary notes (see Workflow)
```

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint
- `npm run lint:fix` — Run ESLint with auto-fix
- `npm run format` — Format all files with Prettier
- `npm run format:check` — Check formatting without writing
- `npm run check` — Run svelte-check (TypeScript validation for .svelte files)
- `npm run test` — Run the Vitest unit tests once (`npm run test:watch` to keep them running)
- `npm run test:e2e` — Playwright smoke tests against the production build on a fresh, seeded
  `e2e.db` (port 4173). CI runs them on pull requests into `main` only
- `npm run verify` — **The full gate, as CI runs it:** lint, format:check, check, test, build. Run it
  before every commit
- `npm run game:add "Game Name" 2023` — Add a new game (auto-generates ID + placeholder)
- `npm run game:list` — List all games sorted by year
- `npm run db:generate` — Generate a migration in `drizzle/` from `src/lib/server/schema.ts`
- `npm run db:migrate` — Apply pending migrations locally (`file:local.db`)
- `npm run db:migrate:staging` / `db:migrate:production` — Apply them to a named stage, reading
  `TURSO_STAGING_*` / `TURSO_PRODUCTION_*`; no `.env` editing, and guarded against a mixed-up URL
- `npm run db:check -- --target=<stage>` — Read-only: integrity, foreign keys, every migration
  recorded. Run after every migration
- `npm run db:stamp -- --target=local|staging|production` — Record a migration as already applied
  without running its SQL (`--dry-run`, `--tag=`). Used once, for the baseline
- `npm run db:dump -- --target=<stage>` — Timestamped JSON snapshot of every table into
  `backups/` (gitignored). Run before anything destructive
- `npm run db:refresh-staging` — Replace staging's games and screenshots with production's
  (`--dry-run`, `--no-backup`). One way only; `scores` is left alone
- `npm run db:seed` — Upsert `games.json` into the database by slug (`-- --force`, `-- --dry-run`)
- `npm run db:studio` — Drizzle Studio (browse the database)
- `npm run blob:migrate` — Upload `static/screenshots/` to Vercel Blob and rewrite DB URLs (`--dry-run`, `--force`)
- `npm run brand:render` — With `npm run dev` running: render the favicons, app icons and OG image
  from `/styleguide/brand/*` into `static/` (headless Brave over CDP, `sharp`). Laptop only, when the
  brand changes; the PNGs are committed

## Conventions

- **Svelte 5 runes only** (`$state`, `$derived`, `$props`, `$effect`) — no stores, no `$:`, no
  `export let`, no `on:event` (use `onclick`). Never name a variable `state`
- `let foo: Type = $state(init)` — annotate the `let` (house style; `$state<T>()` also works)
- Keyed `{#each items as item (item.id)}` (lint-enforced). Tabs, single quotes, no trailing commas
  (Prettier; Tailwind classes sorted by its plugin)
- **Game UI: tokens and primitives only** — `@theme` colours, `ui/` components, transitions from
  `$lib/motion` (it honours reduced motion), opaque surfaces under text. Full rules:
  `docs/architecture/frontend.md`
- **Accessibility:** content in `<main>`, one `h1` per phase, focus moves to it on a phase
  change; axe-core clean
- Screenshot URLs always go through `resolveScreenshotUrl()` (`src/lib/imageUrl.ts`)
- How to structure code, write tests and keep docs right: `.claude/rules/architecture.md`,
  `testing.md`, `code-style.md`, `svelte5-runes.md`, `documentation.md`, `quality-checks.md`

## Invariants — never break these

Each one cost something to learn; the linked doc has the story.

- **The server is the referee.** The client gets a run id and, per card, an image only; it scores
  nothing. Name and year arrive with the bonus answer or a miss. Every write is conditional on the
  stage and position it read (409 otherwise). Rules stay pure in `runRules.ts` / `placement.ts` /
  `scoring.ts`, which the server imports, never copies (`game-architecture.md` § The referee)
- **A game is live in a tier only when published AND it has a primary screenshot of that tier.**
  One primary per (game, tier), enforced by `reconcilePrimaries()` and a partial unique index
- **No client-side fallback dataset.** If `POST /api/runs` fails, there is no game; the welcome
  screen shows the error with a retry
- **A blob name never names the game:** `screenshots/<32 hex>.webp`, never reused. Outside
  production under `staging/`. **A stage only deletes its own blobs** (`deleteScreenshotBlob()`)
- **Local `.env` points at `file:local.db`, never at Turso** — the local admin panel can delete.
  Migration tooling reads `TURSO_STAGING_*` / `TURSO_PRODUCTION_*`, which nothing in `src/` reads
- **Data flows one way, production → staging** (`db:refresh-staging`). Never run `blob:migrate`
  against staging
- **Only `drizzle/` changes the schema** (`db:generate` → review → `db:migrate`; `db:push` is gone).
  GitHub Actions applies them: staging on push to `develop`, production on the release merge,
  and Vercel holds the production deploy until **Migrate production** is green.
  Expand, then contract. Each migration must keep the previous code working. `db:dump` before
  anything destructive (`docs/runbooks/schema-migrations.md`)
- **Env vars are bound at build time** — a change needs a redeploy. `ADMIN_PASSWORD`,
  `RAWG_API_KEY` and the Turso tokens are Vercel _sensitive_: the local `.env` holds the only
  readable copy
- **The Pro gate** (`PRO_MIN_POOL` = 100) is enforced on the server too (409);
  `PRO_MIN_POOL_OVERRIDE` is ignored in production
- **Privacy:** the privacy page lists every `localStorage` key (`STORAGE_KEYS`) and every kind of
  data collected. A new key, cookie, third-party request or counter changes it in the same commit
- **Only `rawg.io` URLs are ever fetched** by the RAWG proxy; untrusted input is checked on the
  server (`parseCrop`, `checkName`, `rawgSourceUrl`)

## Workflow

- Work on `develop` directly; `npm run verify` before every push (CI runs after it, so red =
  staging broken). Release = PR `develop` → `main` (`npm run test:e2e` first); CI then
  fast-forwards `develop` to `main`. Hotfixes `hotfix/*` off `main`. Full flow:
  `docs/runbooks/release.md`
- **Docs describe the present; history goes into commits, `PLAN.md` and `docs/history/`.** A
  change that makes a doc wrong fixes it in the same commit (`.claude/rules/documentation.md`)
- **End every implementation session with `/wrap-up`**: the gate, the plan's checkboxes, the docs
  the change made wrong, the commit, the scratchpad
- **`scratchpad/`** (repo root, gitignored) is the place for temporary files that must outlive a
  session: notes for the next session, one-off driver scripts, screenshots, logs. One-session
  files go in the session's own scratchpad instead. Nothing in `src/`, `scripts/` or `docs/` may
  depend on it, and anything worth keeping moves into the repo proper. **Delete what is no longer
  needed** — at the latest at `/wrap-up`, and everything tied to a milestone when it is released.
  Database dumps go in `backups/`, never here
