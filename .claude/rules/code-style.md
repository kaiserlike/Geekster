# Code Style Rules

## Formatting (enforced by Prettier)

- Tabs for indentation (not spaces)
- Single quotes (not double quotes)
- No trailing commas
- Tailwind class ordering is automatic via `prettier-plugin-tailwindcss`
- Pre-commit hook runs Prettier automatically on staged files

## TypeScript

- Strict mode enabled — no `any` types unless absolutely necessary
- Prefer explicit return types on exported functions
- Use `type` imports: `import type { Foo } from './types'`
- Define interfaces/types in `src/lib/types.ts` for shared types

## Component structure

- One component per file in `src/lib/components/`
- Props interface at top, then state, then derived values, then effects, then functions, then markup
- Keep components focused — extract sub-components when a component exceeds ~200 lines of logic

## Constants

- Extract magic numbers into named constants at module top or in a shared constants file
- Game balance constants (lives, target placements, scoring thresholds) go in the relevant module

## Naming

- Components: PascalCase (`GameCard.svelte`)
- Files: camelCase for `.ts` files, PascalCase for `.svelte` files
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE for true constants, camelCase for derived config
- CSS classes: Tailwind utility classes only (no custom CSS classes unless absolutely necessary)

## Scripts (in /scripts)

- Use `.cjs` extension — the project has `"type": "module"` in package.json
- Include shebang and usage instructions in script comments
- Validate CLI arguments before processing
