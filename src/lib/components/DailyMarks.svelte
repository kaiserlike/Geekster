<script lang="ts">
	import { tf } from '$lib/i18n.svelte';

	interface Props {
		/** One character per card: `o` placed right, `x` missed */
		marks: string;
		class?: string;
	}

	let { marks, class: className = '' }: Props = $props();

	const cells = $derived([...marks].map((mark, i) => ({ key: i, hit: mark === 'o' })));
	const hits = $derived(cells.filter((c) => c.hit).length);
</script>

<!-- A Daily Run at a glance (10d): one square per card, turquoise placed right, red missed -->
<div
	role="img"
	aria-label={tf<(hits: number, misses: number) => string>('daily.marks')(
		hits,
		cells.length - hits
	)}
	class="flex gap-1.25 {className}"
	data-marks={marks}
>
	{#each cells as cell (cell.key)}
		<span class="rounded-chip size-4.5 {cell.hit ? 'bg-accent' : 'bg-danger'}"></span>
	{/each}
</div>
