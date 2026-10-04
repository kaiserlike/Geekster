# Architecture Rules

How code is split in this project. These describe what the best parts of the codebase already do;
new code follows them, and code that is touched moves towards them.

## Functional core, imperative shell

- **Every rule is a pure function in a plain module** — `src/lib/*.ts` for rules both sides use
  (`placement.ts`, `scoring.ts`, `crop.ts`, `daily.ts`, `playerName.ts`), `src/lib/server/runRules.ts`
  for the referee. No I/O, no `Date.now()`, no randomness inside: time, ids and shuffles are passed
  in. That is what makes them testable without mocks
- **Server modules are the shell:** read from the database, call the pure rule, write the result.
  `runs.ts` is the model: `placeCard()` reads the row, asks `runRules.place()`, writes on condition
- **Routes are thin:** parse the request, call one server function, map errors. A `+server.ts`
  longer than ~20 lines is doing a server module's job (see `api/runs/[id]/place/+server.ts`)
- **Components render and forward intent.** State and its transitions live in a `.svelte.ts` class
  or module (`game.svelte.ts`, `dragPlace.svelte.ts`, `decadeRuler.svelte.ts`); a rule a component
  needs lives in a plain module, so it can be tested
- **One copy of a rule.** The server imports `placement.ts` / `scoring.ts`; nothing re-implements
  them. A rule that changes, changes there, with its test

## Boundaries

- **Server-only code lives in `src/lib/server/`** — SvelteKit refuses to bundle it into the client
- **Parse at the boundary.** Untrusted input (request bodies, query strings, form posts, URLs from
  the browser) becomes a typed value or is rejected in the first function that touches it
  (`intField`, `runIdParam`, `parseCrop`, `checkName`, `rawgSourceUrl`). Inner code trusts its
  types and does not re-validate
- **Errors are typed classes** (`RunConflict`, `RunNotFound`, `DailyUnavailable` …) thrown where the
  condition is detected, and mapped to HTTP in **one** place per area (`runErrorResponse()`).
  Unknown errors are logged and answered generically; nothing leaks a stack or SQL to a player
- **Concurrency is handled in the database, not in memory.** A serverless function has no shared
  state: a write is conditional on what was read (`WHERE stage = ? AND position = ?`), uniqueness
  is an index. Never rely on "read, check in JS, write" for anything two requests could race on
- **Dependencies point inward.** Pure modules import nothing from `server/`, components or
  SvelteKit. New server code that needs the database takes it as a parameter where practical
  (`fn(db, …)`), so it can be tested against an in-memory database (see `testing.md`)

## Size and responsibility

- One reason to change per module (the useful part of SOLID here; class hierarchies and interfaces
  for their own sake are not). A file that both renders and fetches, or both decides and stores,
  is two files
- Components: aim for ≤ ~200 lines of script logic; extract sub-components or a state class
  beyond that. Current outliers to split when next touched: `routes/admin/games/[id]/+page.svelte`,
  `i18n.svelte.ts` (the translation table could move to per-language data files)
- Prefer functions and plain data; use a class when it owns reactive state with behaviour (the
  `*.svelte.ts` controllers) or as an error type

## Comments

- A comment says **why** — the constraint, the trap, the decision — not what the next line does
- No history in comments ("since Sprint 9", "was X before"): that is what git and
  `docs/history/` are for. A decision ID or doc pointer is fine when the why is long
