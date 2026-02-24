<script lang="ts">
	import { getState, resetGame, restartGame } from '$lib/game.svelte';
	import { addLeaderboardEntry } from '$lib/leaderboard';
	import type { LeaderboardEntry } from '$lib/types';
	import GameCard from './GameCard.svelte';
	import Leaderboard from './Leaderboard.svelte';

	const gameState = $derived(getState());

	const isWin = $derived(gameState.correctPlacements >= gameState.targetPlacements);

	let leaderboardEntries: LeaderboardEntry[] = $state([]);
	let highlightIndex: number = $state(-1);
	let saved: boolean = $state(false);

	$effect(() => {
		if (!saved) {
			saved = true;
			const entry: LeaderboardEntry = {
				score: gameState.totalScore,
				date: new Date().toISOString(),
				correctPlacements: gameState.correctPlacements,
				wrongPlacements: gameState.wrongPlacements,
				livesRemaining: gameState.lives,
				isWin,
				bestStreak: gameState.bestStreak
			};
			const updated = addLeaderboardEntry(entry);
			leaderboardEntries = updated;
			highlightIndex = updated.findIndex((e) => e.date === entry.date && e.score === entry.score);
		}
	});
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
		<p class="text-2xl font-bold text-purple-400 tabular-nums">
			{gameState.totalScore.toLocaleString()} points
		</p>
		<p class="mt-1 text-gray-400">
			{gameState.correctPlacements} correct, {gameState.wrongPlacements} wrong
			{#if gameState.lives > 0}
				&mdash; {gameState.lives} {gameState.lives === 1 ? 'life' : 'lives'} remaining
			{/if}
			{#if gameState.bestStreak > 1}
				&mdash; best streak {gameState.bestStreak}x
			{/if}
		</p>
	</div>

	<!-- Leaderboard -->
	{#if leaderboardEntries.length > 0}
		<div class="mx-auto mb-8 w-full max-w-2xl">
			<Leaderboard entries={leaderboardEntries} {highlightIndex} />
		</div>
	{/if}

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
