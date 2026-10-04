# Testing Rules

## What is tested today

- Vitest runs every `*.test.ts` under `src/` in the node environment (`vite.config.ts`). The pure
  rules are well covered: placement, scoring, crop, daily, the board, names, share text, tiers,
  the referee's `runRules.ts`
- **Not covered yet** (planned in `PLAN.md` § Milestone 11): the database layer — `runs.ts`'
  conditional writes, one Daily per device, best-per-device in `scores.ts` — and the API routes;
  no end-to-end test. Until then, a change there is verified on staging by hand and the check is
  written into the work package

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
  module and test that. The DOM is covered by the end-to-end smoke tests once they exist

## Database integration tests (the pattern for Milestone 11)

- An in-memory libSQL client (`createClient({ url: ':memory:' })`) with the real migrations from
  `drizzle/` applied (`migrate()` from `drizzle-orm/libsql/migrator`), fresh per test file
- Server functions under test take the database as a parameter, or `./db` is replaced with
  `vi.mock` for code that still imports the singleton
- What they must prove: a double `place` or `next` gets `RunConflict`; a second Daily for a device
  is refused; the board returns each device's best once; a late bonus scores as skipped

## Before committing

`npm run verify` (see `quality-checks.md`). A red test is never committed with "fix later".
