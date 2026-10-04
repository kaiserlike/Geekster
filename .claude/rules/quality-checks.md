# Quality Check Rules

## Before every commit

```bash
npm run verify
```

It runs, in order and stopping at the first failure, exactly what CI runs:

1. `npm run lint` — ESLint (unused vars, missing keys, Svelte-specific issues)
2. `npm run format:check` — Prettier
3. `npm run check` — svelte-check (TypeScript inside `.svelte` files)
4. `npm run test` — Vitest
5. `npm run build` — the production build (SSR issues, import errors)

`verify` is the one name for the gate: CLAUDE.md, the runbooks and `/wrap-up` refer to it, so a
step added to CI is added to `package.json` and nowhere else.

## CI

`.github/workflows/ci.yml` runs `npm ci` and the same five steps on every pull request and on
pushes to `main` and `develop`. It is a required check on `main`. It needs no environment
variables — the database client is lazy and reads `$env/dynamic/private` at request time.

Vercel deploys separately through its Git integration and only runs `vite build`. CI is the real
gate, and on `develop` it runs **after** the push — so `verify` locally first, or staging is
already broken when CI turns red.

## Pre-commit hook

- Husky + lint-staged run ESLint `--fix` and Prettier on staged files
- If the hook fails, fix the issue and create a NEW commit (don't `--amend`)

## Common lint issues in this project

- `svelte/require-each-key`: every `{#each}` needs a key expression
- Unused variables: `_` prefix, or `Array.from({ length: n }, (_v, i) => i)` for index loops
- Never name a variable `state` in `.svelte` / `.svelte.ts` files

## Build validation

- `@sveltejs/adapter-vercel`: SSR and API routes; nothing needs to be prerenderable; no base path
- Screenshot URLs may be absolute (Vercel Blob) or local paths — always resolve them through
  `resolveScreenshotUrl()` in `src/lib/imageUrl.ts`
- Server-only code belongs in `src/lib/server/` — importing it from a component breaks the build
