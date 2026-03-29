# Svelte 5 Runes Rules

## $state usage

- In `.svelte` files: `let foo: Type = $state(initialValue)` — type annotation on the `let`
- In `.svelte.ts` files: `$state<Type>(initialValue)` is allowed but discouraged for consistency
- NEVER use `$state<Type>()` generic syntax in `.svelte` files — causes svelte-check errors
- NEVER name a variable `state` in any `.svelte` or `.svelte.ts` file — conflicts with the `$state` rune. Use `gameState` or a descriptive name instead.

## $derived usage

- Use `$derived(expression)` for computed values
- Use `$derived.by(() => { ... })` for multi-line computations
- Let TypeScript infer types from `$derived` when the source type is already known

## $props usage

- Destructure props: `let { prop1, prop2 }: Props = $props()`
- Define a `Props` interface or type for each component's props

## $effect usage

- Always return a cleanup function from `$effect` when using timers/intervals/listeners
- Clear ALL timers in cleanup — stale timers cause memory leaks
- Avoid setting state inside `$effect` that triggers the same effect (infinite loops)
- Prefer `$derived` over `$effect` + `$state` when the value is a pure computation

## Each blocks

- Always use keyed each: `{#each items as item (item.id)}` — enforced by ESLint
- `animate:flip` must be on the ONLY direct child element of a keyed `{#each}` block
- For index-only iteration: `Array.from({ length: n }, (_v, i) => i)` to avoid unused-var lint errors

## Legacy patterns to AVOID

- Do NOT use Svelte stores (`writable`, `readable`, `derived` from `svelte/store`)
- Do NOT use `$:` reactive declarations
- Do NOT use `export let` for props (use `$props()` instead)
- Do NOT use `on:event` syntax (use `onevent` attribute syntax instead: `onclick`, `onkeydown`, etc.)
