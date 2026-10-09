# Svelte 5 Runes Rules

## $state

- House style: annotate the `let` — `let foo: Type = $state(initialValue)`. (`$state<Type>()`
  compiles and type-checks fine — verified 2026-10-04; the annotation is kept for consistency)
- **Never name a variable `state`** in a `.svelte` or `.svelte.ts` file — it conflicts with the
  `$state` rune. Use `gameState` or another descriptive name
- Reactive state with behaviour goes into a class in a `.svelte.ts` file (`GameState`,
  `DragPlace`, `DecadeRulerState`), not into a component

## $derived

- `$derived(expression)` for computed values, `$derived.by(() => { … })` for multi-line ones
- Prefer `$derived` over `$effect` + `$state` whenever the value is a pure computation

## $props

- Destructure with a `Props` type: `let { a, b }: Props = $props()`

## $effect

- Only for synchronising with the outside world (DOM, timers, storage, listeners), never to
  compute state
- Return a cleanup that clears **every** timer, interval and listener it set up
- Never write state in an effect that the same effect reads (infinite loop)

## Each blocks

- Always keyed: `{#each items as item (item.id)}` — enforced by ESLint
- `animate:flip` must be on the ONLY direct child element of a keyed `{#each}` block
- Index-only iteration: `Array.from({ length: n }, (_v, i) => i)`

## Legacy patterns to avoid

- No Svelte stores (`writable`, `readable`, `derived` from `svelte/store`)
- No `$:` reactive declarations, no `export let` (use `$props()`), no `on:event` (use `onclick`)
