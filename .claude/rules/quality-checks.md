# Quality Check Rules

## Before committing, always run (in order):

1. `npm run lint` — ESLint (catches unused vars, missing keys, Svelte-specific issues)
2. `npm run check` — svelte-check (TypeScript validation inside .svelte files)
3. `npm run test` — Vitest unit tests (scoring, placement)
4. `npm run build` — Full production build (catches SSR issues, import errors)

## CI

`.github/workflows/ci.yml` runs `npm ci`, `lint`, `format:check`, `check`, `test` and `build` on every
pull request and on pushes to `main` and `develop`. It is a required check on `main`, so a
failing lint blocks the merge. It needs no environment variables — the database client is lazy
and reads `$env/dynamic/private` at request time.

Vercel deploys separately through its Git integration and only runs `vite build`, which catches
neither a lint error nor a type error inside a `.svelte` file. CI is the real gate.

## Pre-commit hook

- Husky + lint-staged runs ESLint fix + Prettier on staged files automatically
- If the hook fails, fix the issue and create a NEW commit (don't --amend)

## Common lint issues in this project

- `svelte/require-each-key`: Every `{#each}` must have a key expression
- Unused variables: Use `_` prefix or the `Array.from` pattern for intentionally unused params
- `$state` naming: Never name a variable `state` in .svelte files

## Build validation

- The project uses `@sveltejs/adapter-vercel` — SSR and API routes are available, nothing needs to be pre-renderable
- No base path (the GitHub Pages `/Geekster` prefix is gone)
- Screenshot URLs come from the database and may be absolute (Vercel Blob) or local paths — always resolve them through `resolveScreenshotUrl()` in `src/lib/imageUrl.ts`, never by string-concatenating `base`
- Server-only code belongs in `src/lib/server/` — importing it from a component breaks the build
