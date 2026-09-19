# Quality Check Rules

## Before committing, always run (in order):

1. `npm run lint` — ESLint (catches unused vars, missing keys, Svelte-specific issues)
2. `npm run check` — svelte-check (TypeScript validation inside .svelte files)
3. `npm run build` — Full production build (catches SSR issues, import errors)

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
