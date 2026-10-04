# Code Style Rules

How code is split is in `architecture.md`; this file is about how it reads.

## Formatting (enforced by Prettier)

- Tabs, single quotes, no trailing commas; Tailwind classes sorted by `prettier-plugin-tailwindcss`
- The pre-commit hook formats staged files; `npm run format:check` is part of `verify`
- `drizzle/` is in `.prettierignore` on purpose: the `.sql` bytes are hashed into every database's
  migration record

## TypeScript

- Strict mode; no `any` — use `unknown` and narrow it at the boundary
- `import type { Foo } from './types'` for type-only imports
- Explicit return types on exported functions
- Shared types live in `src/lib/types.ts`; a type used by one module stays in that module
- Prefer unions of string literals (`'normal' | 'pro'`) with a type guard (`isDifficulty`) over
  enums

## Naming

- Components PascalCase (`GameCard.svelte`); `.ts` files camelCase; variables and functions
  camelCase; true constants UPPER_SNAKE_CASE
- Name by meaning in the game's language: `placeCard`, `bonusDeadline`, `poolCleared` — not `handle`,
  `data`, `doStuff`
- Booleans read as questions: `isProOpen`, `hasPlayedBefore`

## Constants

- No magic numbers: name them at the top of the module that owns the rule (`PRO_MIN_POOL` in
  `modes.ts`, `COMPACT_TIMELINE_AT` in `Timeline.svelte`); game-balance constants live with the
  rule that uses them

## Styling

- Tailwind utility classes only; custom CSS only where Tailwind cannot express it (and then in
  the component's `<style>` or `app.css`)
- Game UI uses the design tokens and `ui/` primitives (`docs/architecture/frontend.md`)

## Scripts (`scripts/`)

- **New scripts are ES modules with a `.js` extension** (the package is `"type": "module"`), like
  `seed-database.js`, `dump-database.js`, `db-target.js`. The older `.cjs` scripts stay as they are
  until they are touched for another reason
- A header comment with what the script does, its usage and its flags; validate arguments before
  doing anything; `--dry-run` for anything that writes to a database or the blob store
- A new script that can reach a live database takes `--target=<stage>` and resolves it through
  `scripts/db-target.js` (as `db:dump` and `db:refresh-staging` do), never from
  `TURSO_DATABASE_URL`. `seed-database.js` and `migrate-screenshots-to-blob.js` still read
  `TURSO_DATABASE_URL`; move them over when they are next touched
