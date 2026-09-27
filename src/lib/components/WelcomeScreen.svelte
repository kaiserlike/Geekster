<script lang="ts">
	import { getState, startGame } from '$lib/game.svelte';
	import { getClassicLeaderboard, getLeaderboard } from '$lib/leaderboard';
	import { loadStoredMode, playableMode, storeMode, type ProGate } from '$lib/modes';
	import { LIFE_REGAIN_STREAK, MAX_LIVES } from '$lib/placement';
	import { tf, tk, ts } from '$lib/i18n.svelte';
	import type { Difficulty, LeaderboardEntry } from '$lib/types';
	import Leaderboard from './Leaderboard.svelte';
	import ModeChoice from './ModeChoice.svelte';

	interface Props {
		proGate: ProGate;
	}

	let { proGate }: Props = $props();

	const gameState = $derived(getState());

	// The stored choice and the local lists live in this browser only. Both are
	// read after hydration, so the server's HTML (always Normal, no list) and the
	// first client render agree.
	let chosen: Difficulty = $state('normal');
	let hydrated: boolean = $state(false);

	$effect(() => {
		chosen = loadStoredMode();
		hydrated = true;
	});

	// A remembered Pro choice while Pro is gated plays Normal, without an error.
	const mode = $derived(playableMode(chosen, proGate.open));

	function choose(next: Difficulty) {
		chosen = next;
		storeMode(next);
	}

	const endlessEntries: LeaderboardEntry[] = $derived(hydrated ? getLeaderboard(mode) : []);
	// A returning player has only 10-game scores until their first endless run ends.
	// The compact list shows score and date alone, so those are all a classic row lends.
	// Classic runs were all Normal, so Pro never falls back to them.
	const showingClassic = $derived(mode === 'normal' && endlessEntries.length === 0);
	const leaderboardEntries: LeaderboardEntry[] = $derived(
		showingClassic && hydrated
			? getClassicLeaderboard().map((entry) => ({
					score: entry.score,
					date: entry.date,
					correctPlacements: entry.correctPlacements,
					wrongPlacements: entry.wrongPlacements,
					bestStreak: entry.bestStreak,
					livesWonBack: 0,
					endReason: 'outOfLives' as const
				}))
			: endlessEntries
	);
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
					<span class="font-semibold text-white"
						>{tf<(n: number) => string>('welcome.rule5.streak')(LIFE_REGAIN_STREAK)}</span
					>
					{tf<(n: number) => string>('welcome.rule5.post')(MAX_LIVES)}
				</li>
				<li>{ts('welcome.rule6')}</li>
			</ol>
		</div>

		{#if gameState.error}
			<div
				role="alert"
				class="mb-6 rounded-xl border border-red-800 bg-red-950/60 p-4 text-left text-red-200"
			>
				<p class="font-semibold text-red-100">{ts('error.title')}</p>
				<p class="mt-1 text-sm">{tk(gameState.error)}</p>
			</div>
		{/if}

		<ModeChoice {mode} {proGate} onchoose={choose} disabled={gameState.loading} />

		<button
			onclick={() => startGame(mode)}
			disabled={gameState.loading}
			class="cursor-pointer rounded-xl bg-purple-600 px-12 py-4 text-xl font-bold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if gameState.loading}
				{ts('welcome.loading')}
			{:else if gameState.error}
				{ts('error.retry')}
			{:else}
				{ts('welcome.startGame')}
			{/if}
		</button>

		{#if leaderboardEntries.length > 0}
			<div class="mt-8">
				<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
					{showingClassic
						? ts('welcome.topScoresClassic')
						: mode === 'pro'
							? ts('welcome.topScoresPro')
							: ts('welcome.topScores')}
				</h3>
				<Leaderboard entries={leaderboardEntries} {mode} compact={true} />
			</div>
		{/if}
	</div>
</div>
