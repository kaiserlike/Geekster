<script lang="ts">
	import { startGame } from '$lib/game.svelte';
	import { getLeaderboard } from '$lib/leaderboard';
	import { ts } from '$lib/i18n.svelte';
	import type { LeaderboardEntry } from '$lib/types';
	import Leaderboard from './Leaderboard.svelte';

	const leaderboardEntries: LeaderboardEntry[] = $derived(getLeaderboard());
</script>

<div class="flex min-h-screen flex-col items-center justify-center px-4">
	<div class="max-w-lg text-center">
		<h1
			class="mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-6xl font-bold text-transparent"
		>
			Geekster
		</h1>
		<p class="mb-8 text-xl text-gray-300">{ts('welcome.subtitle')}</p>

		<div class="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
			<h2 class="mb-3 text-lg font-semibold text-gray-100">{ts('welcome.howToPlay')}</h2>
			<ol class="list-inside list-decimal space-y-2 text-gray-400">
				<li>{ts('welcome.rule1')}</li>
				<li>{ts('welcome.rule2')}</li>
				<li>
					{ts('welcome.rule3.pre')}
					<span class="font-semibold text-white">{ts('welcome.rule3.lives')}</span>
					{ts('welcome.rule3.post')}
				</li>
				<li>
					{ts('welcome.rule4.pre')}
					<span class="font-semibold text-white">{ts('welcome.rule4.year')}</span>
					{ts('welcome.rule4.and')}
					<span class="font-semibold text-white">{ts('welcome.rule4.name')}</span>
					{ts('welcome.rule4.post')}
				</li>
				<li>
					{ts('welcome.rule5.pre')}
					<span class="font-semibold text-white">{ts('welcome.rule5.games')}</span>
					{ts('welcome.rule5.post')}
				</li>
			</ol>
		</div>

		<button
			onclick={startGame}
			class="cursor-pointer rounded-xl bg-purple-600 px-12 py-4 text-xl font-bold text-white transition-colors hover:bg-purple-500"
		>
			{ts('welcome.startGame')}
		</button>

		{#if leaderboardEntries.length > 0}
			<div class="mt-8">
				<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
					{ts('welcome.topScores')}
				</h3>
				<Leaderboard entries={leaderboardEntries} compact={true} />
			</div>
		{/if}
	</div>
</div>
