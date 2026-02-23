<script lang="ts">
	import type { Game } from '$lib/types';
	import { slide } from 'svelte/transition';

	let {
		game,
		hideYear,
		highlight,
		revealed = false,
		minified = false
	}: {
		game: Game;
		hideYear: boolean;
		highlight: boolean;
		revealed?: boolean;
		minified?: boolean;
	} = $props();

	const showInfo = $derived(!hideYear || revealed);
</script>

{#if minified}
	<div
		class="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-4 py-2"
	>
		<span class="truncate text-sm font-medium text-gray-300">{game.name}</span>
		<span class="ml-2 shrink-0 font-bold text-purple-400">{game.year}</span>
	</div>
{:else}
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
{/if}
