# Testing Rules

## What is tested today

- Vitest runs every `*.test.ts` under `src/` in the node environment (`vite.config.ts`). The pure
  rules are well covered: placement, scoring, crop, daily, the board, names, share text, tiers,
  the referee's `runRules.ts`
- The referee's database layer runs against an in-memory database with the real migrations
  (`runs.test.ts`, `scores.test.ts`): conditional writes and races, the late bonus, one score per
  run, one Daily per device, the board's best-per-device and periods, the Pro gate
- **Not covered yet:** the API routes (`+server.ts`), the admin's `games.ts`, `daily.ts`'s status
  and `stats.ts`. A change there is verified on staging by hand and the check is written into the
  work package
- **End to end** (`tests/e2e/`, Playwright, `npm run test:e2e`): an endless run to the result
  screen, a perfect Daily with its share text, the admin login and games list, axe on the game's
  phases. Against the production build on a fresh `e2e.db` seeded from `games.json`, so a test
  reads a card's year from its `src` (`tests/e2e/play.ts`). Runs in CI on pull requests into
  `main` only; not part of `verify`. Locally it needs port 4173 free

## Rules

- **Every new or changed rule comes with tests in the same commit.** Pure rule → unit test next to
  it (`foo.ts` → `foo.test.ts`)
- **Every bug fix starts with a test that fails without the fix**, where the bug is reachable from
  a test at all. If it is not (layout, a browser quirk), say so in the commit and describe the
  manual check
- **Test behaviour, not implementation.** Assert on what a caller sees (return values, the HTTP
  answer, the rows written), not on which helper was called. No snapshot tests of large objects
- **Name a test by the rule it protects**: `it('a late bonus counts as skipped')`, not
  `it('works')`. The test file reads as the rule's specification
- **Edges first:** empty pool, last card, last life on the last card, boundaries of every
  threshold (±0/1/2/3 years, Dice 0.8, 2 and 20 characters), duplicates, the second of two
  concurrent requests
- **No mocks for pure code.** Pass time, randomness and ids in. Mock only at the process edge
  (`fetch`, Vercel Blob), and prefer a real in-memory database to a mocked one
- **Keep tests fast and deterministic:** no network, no real clock, no sleeps; seed every random
- Rune state (`*.svelte.ts`) and components are not unit-tested: extract the rule into a plain
  module and test that. The DOM is covered by the end-to-end smoke tests: a flow a player depends
  on gets a step there, through the page as a player uses it (roles, labels, visible text)

## Database integration tests

- `src/lib/server/testDb.ts`: `freshDb()` makes an in-memory libSQL with every migration from
  `drizzle/` applied, so indexes and defaults are production's; `seedGames()` / `normalGames()`
  insert published games with their primaries; `runRow()` reads what the server dealt
- A test file replaces the singleton: `vi.mock('./db', () => import('./testDb'))`, and calls
  `freshDb()` in `beforeEach`. Mock `$env/dynamic/private` as `{ env: {} }` where the code reads
  it, so a local `.env` (`PRO_MIN_POOL_OVERRIDE`) cannot change the result. A test never reaches
  a live stage: nothing in `testDb.ts` reads `TURSO_*`
- Time goes in as a parameter (`createRun(mode, device, now)`, `placeCard(…, now)`), never a fake
  clock
- A race is two calls in one `Promise.allSettled`: both read before either writes, so it tests
  the conditional write, not just the stage check. Assert that the loser gets the typed error
  (`RunConflict`), not a database error
- Check a new test by breaking its guarantee on purpose (drop the `WHERE`, the `ON CONFLICT`) and
  watching it fail

## Before committing

`npm run verify` (see `quality-checks.md`). A red test is never committed with "fix later".
