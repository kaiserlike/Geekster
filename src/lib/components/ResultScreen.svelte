<script lang="ts">
	import { getState, resetGame, restartGame } from '$lib/game.svelte';
	import GameCard from './GameCard.svelte';

	const gameState = $derived(getState());

	const isWin = $derived(gameState.correctPlacements >= gameState.targetPlacements);
</script>

<div class="flex min-h-screen flex-col px-4 py-6">
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-4xl font-bold">
			{#if isWin}
				<span class="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
					You win!
				</span>
			{:else}
				<span class="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
					Game Over
				</span>
			{/if}
		</h1>
		<p class="text-gray-400">
			{gameState.correctPlacements} correct, {gameState.wrongPlacements} wrong
			{#if gameState.lives > 0}
				&mdash; {gameState.lives} {gameState.lives === 1 ? 'life' : 'lives'} remaining
			{/if}
		</p>
	</div>

	<!-- Final timeline -->
	<div class="mx-auto w-full max-w-2xl flex-1">
		<h2 class="mb-4 text-center text-lg font-semibold text-gray-300">Your Timeline</h2>
		<div class="flex flex-col gap-2">
			{#each gameState.timeline as game (game.id)}
				<GameCard {game} hideYear={false} highlight={false} />
			{/each}
		</div>
	</div>

	<!-- Actions -->
	<div class="mt-8 flex justify-center gap-4 pb-8">
		<button
			onclick={restartGame}
			class="cursor-pointer rounded-xl bg-purple-600 px-10 py-3 text-lg font-bold text-white transition-colors hover:bg-purple-500"
		>
			Play Again
		</button>
		<button
			onclick={resetGame}
			class="cursor-pointer rounded-xl border-2 border-gray-700 px-8 py-3 text-lg font-bold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
		>
			Main Menu
		</button>
	</div>
</div>
