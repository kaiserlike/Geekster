<script lang="ts">
	import type { Game } from '$lib/types';
	import { slide } from 'svelte/transition';

	let {
		game,
		hideYear,
		highlight,
		revealed = false
	}: { game: Game; hideYear: boolean; highlight: boolean; revealed?: boolean } = $props();

	const showInfo = $derived(!hideYear || revealed);
</script>

<div
	class="overflow-hidden rounded-lg border-2 transition-all {highlight
		? 'border-purple-500 shadow-lg shadow-purple-500/20'
		: 'border-gray-700'}"
>
	<img
		src={game.screenshot}
		alt={hideYear && !revealed ? 'Mystery game' : game.name}
		class="aspect-video w-full object-cover"
	/>
	{#if showInfo}
		<div
			transition:slide={{ duration: 300 }}
			class="flex items-center justify-between bg-gray-900 px-4 py-2"
		>
			<span class="text-sm font-medium text-gray-300">{game.name}</span>
			<span class="font-bold text-purple-400">{game.year}</span>
		</div>
	{/if}
</div>
