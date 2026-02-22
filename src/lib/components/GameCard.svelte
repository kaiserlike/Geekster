<script lang="ts">
	import type { Game } from '$lib/types';

	let { game, hideYear, highlight }: { game: Game; hideYear: boolean; highlight: boolean } =
		$props();
</script>

<div
	class="overflow-hidden rounded-lg border-2 transition-all {highlight
		? 'border-purple-500 shadow-lg shadow-purple-500/20'
		: 'border-gray-700'}"
>
	<img
		src={game.screenshot}
		alt={hideYear ? 'Mystery game' : game.name}
		class="aspect-video w-full object-cover"
	/>
	{#if !hideYear}
		<div class="flex items-center justify-between bg-gray-900 px-4 py-2">
			<span class="text-sm font-medium text-gray-300">{game.name}</span>
			<span class="font-bold text-purple-400">{game.year}</span>
		</div>
	{/if}
</div>
