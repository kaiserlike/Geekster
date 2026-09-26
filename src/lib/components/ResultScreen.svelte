<script lang="ts">
	import { getState, resetGame, restartGame } from '$lib/game.svelte';
	import { addLeaderboardEntry } from '$lib/leaderboard';
	import { isPerfectRun } from '$lib/placement';
	import { ts } from '$lib/i18n.svelte';
	import type { LeaderboardEntry } from '$lib/types';
	import GameCard, { COMPACT_TIMELINE_AT } from './GameCard.svelte';
	import Leaderboard from './Leaderboard.svelte';

	const gameState = $derived(getState());

	const endReason = $derived(gameState.endReason ?? 'outOfLives');
	const perfect = $derived(isPerfectRun(endReason, gameState.wrongPlacements));
	const poolCleared = $derived(endReason === 'poolCleared');

	const stats = $derived([
		{ label: ts('result.placements'), value: gameState.correctPlacements, tone: 'text-white' },
		{ label: ts('result.mistakes'), value: gameState.wrongPlacements, tone: 'text-red-400' },
		{ label: ts('result.bestStreak'), value: `${gameState.bestStreak}x`, tone: 'text-orange-400' },
		{ label: ts('result.livesWonBack'), value: gameState.livesWonBack, tone: 'text-pink-400' }
	]);

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
				bestStreak: gameState.bestStreak,
				livesWonBack: gameState.livesWonBack,
				endReason
			};
			const updated = addLeaderboardEntry(entry);
			leaderboardEntries = updated;
			highlightIndex = updated.findIndex((e) => e.date === entry.date && e.score === entry.score);

			// Submit to global leaderboard (fire-and-forget). `difficulty` keeps today's
			// value until migration 0003 introduces normal | pro.
			fetch('/api/scores', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					playerName: 'Anonymous',
					totalScore: gameState.totalScore,
					correctPlacements: gameState.correctPlacements,
					wrongPlacements: gameState.wrongPlacements,
					bestStreak: gameState.bestStreak,
					difficulty: 'medium'
				})
			}).catch(() => {
				/* silent fail — localStorage is primary */
			});
		}
	});
</script>

<div class="flex min-h-screen flex-col px-4 py-6">
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-4xl font-bold">
			{#if poolCleared}
				<span
					class="bg-gradient-to-r {perfect
						? 'from-yellow-300 via-amber-400 to-pink-500'
						: 'from-green-400 to-emerald-500'} bg-clip-text text-transparent"
				>
					{perfect ? ts('result.perfectRun') : ts('result.poolCleared')}
				</span>
			{:else}
				<span class="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
					{ts('result.gameOver')}
				</span>
			{/if}
		</h1>
		{#if poolCleared}
			<p class="mb-2 text-gray-300">
				{perfect ? ts('result.perfectRunHint') : ts('result.poolClearedHint')}
			</p>
		{/if}
		<p class="text-2xl font-bold text-purple-400 tabular-nums">
			{gameState.totalScore.toLocaleString()}
			{ts('result.points')}
		</p>
		<dl class="mx-auto mt-4 grid max-w-md grid-cols-2 gap-2 sm:grid-cols-4">
			{#each stats as stat (stat.label)}
				<div class="rounded-lg border border-gray-800 bg-gray-900 px-2 py-2">
					<dt class="text-[11px] tracking-wide text-gray-500 uppercase">{stat.label}</dt>
					<dd class="text-xl font-bold tabular-nums {stat.tone}">{stat.value}</dd>
				</div>
			{/each}
		</dl>
	</div>

	<!-- Leaderboard -->
	{#if leaderboardEntries.length > 0}
		<div class="mx-auto mb-8 w-full max-w-2xl">
			<Leaderboard entries={leaderboardEntries} {highlightIndex} />
		</div>
	{/if}

	<!-- Final timeline -->
	<div class="mx-auto w-full max-w-2xl flex-1">
		<h2 class="mb-4 text-center text-lg font-semibold text-gray-300">
			{ts('result.yourTimeline')}
		</h2>
		<div class="flex flex-col gap-2">
			{#each gameState.timeline as game (game.id)}
				<GameCard
					{game}
					hideYear={false}
					highlight={false}
					minified={gameState.timeline.length > COMPACT_TIMELINE_AT}
				/>
			{/each}
		</div>
	</div>

	<!-- Actions -->
	<div class="mt-8 flex justify-center gap-4 pb-8">
		<button
			onclick={restartGame}
			class="cursor-pointer rounded-xl bg-purple-600 px-10 py-3 text-lg font-bold text-white transition-colors hover:bg-purple-500"
		>
			{ts('result.playAgain')}
		</button>
		<button
			onclick={resetGame}
			class="cursor-pointer rounded-xl border-2 border-gray-700 px-8 py-3 text-lg font-bold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
		>
			{ts('result.mainMenu')}
		</button>
	</div>
</div>
