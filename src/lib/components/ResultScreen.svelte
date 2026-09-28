<script lang="ts">
	import { getState, resetGame, restartGame } from '$lib/game.svelte';
	import { addLeaderboardEntry } from '$lib/leaderboard';
	import { isPerfectRun } from '$lib/placement';
	import { formatNumber, tf, ts } from '$lib/i18n.svelte';
	import type { LeaderboardEntry } from '$lib/types';
	import Leaderboard from './Leaderboard.svelte';
	import TimelineRow from './TimelineRow.svelte';
	import Button from './ui/Button.svelte';
	import Chip from './ui/Chip.svelte';
	import HorizonGrid from './ui/HorizonGrid.svelte';

	// The final timeline shows this many rows before "+ N more"; one more than that shows all
	const RESULT_ROWS = 14;

	const gameState = $derived(getState());

	const endReason = $derived(gameState.endReason ?? 'outOfLives');
	const perfect = $derived(isPerfectRun(endReason, gameState.wrongPlacements));
	const poolCleared = $derived(endReason === 'poolCleared');

	// The headline's glow says how the run ended: red, turquoise, gold
	const headline = $derived(
		perfect
			? { text: ts('result.perfectRun'), glow: '0 0 16px rgb(255 200 87 / 0.8)' }
			: poolCleared
				? { text: ts('result.poolCleared'), glow: '0 0 16px rgb(63 240 228 / 0.8)' }
				: { text: ts('result.gameOver'), glow: '0 0 14px rgb(255 77 109 / 0.6)' }
	);

	const stats = $derived([
		{
			key: 'placed',
			short: ts('result.placements'),
			label: ts('result.placements'),
			value: gameState.correctPlacements,
			tone: 'text-ink'
		},
		{
			key: 'misses',
			short: ts('result.mistakes'),
			label: ts('result.mistakes'),
			value: gameState.wrongPlacements,
			tone: gameState.wrongPlacements > 0 ? 'text-danger' : 'text-accent-strong'
		},
		{
			key: 'best',
			short: ts('result.bestShort'),
			label: ts('result.bestStreak'),
			value: gameState.bestStreak,
			tone: 'text-accent-strong'
		},
		{
			key: 'back',
			short: `♥ ${ts('result.livesBackShort')}`,
			label: ts('result.livesWonBack'),
			value: gameState.livesWonBack,
			tone: 'text-life'
		}
	]);

	const missed = $derived(new Set(gameState.missedIds));
	let showAll: boolean = $state(false);
	const rows = $derived(
		showAll || gameState.timeline.length <= RESULT_ROWS + 1
			? gameState.timeline
			: gameState.timeline.slice(0, RESULT_ROWS)
	);
	const hiddenRows = $derived(gameState.timeline.length - rows.length);

	let leaderboardEntries: LeaderboardEntry[] = $state([]);
	let highlightIndex: number = $state(-1);
	let saved: boolean = $state(false);

	const rank = $derived(
		highlightIndex === 0 && leaderboardEntries.length > 1
			? ts('result.personalBest')
			: highlightIndex > 0
				? tf<(n: number) => string>('result.rank')(highlightIndex + 1)
				: null
	);

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
			const updated = addLeaderboardEntry(gameState.mode, entry);
			leaderboardEntries = updated;
			highlightIndex = updated.findIndex((e) => e.date === entry.date && e.score === entry.score);

			// Submit to the global leaderboard of this mode (fire-and-forget).
			fetch('/api/scores', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					playerName: 'Anonymous',
					totalScore: gameState.totalScore,
					correctPlacements: gameState.correctPlacements,
					wrongPlacements: gameState.wrongPlacements,
					bestStreak: gameState.bestStreak,
					difficulty: gameState.mode
				})
			}).catch(() => {
				/* silent fail — localStorage is primary */
			});
		}
	});
</script>

<div class="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 pt-4 pb-10">
	<!-- The outcome, then the actions: Play again sits above the fold after any run (U15) -->
	<section class="flex flex-col items-center gap-2.5 text-center">
		<Chip tone={gameState.mode === 'pro' ? 'pink' : 'accent'} size="sm">
			<span data-run-mode={gameState.mode}>
				{gameState.mode === 'pro' ? ts('mode.pro') : ts('mode.normal')}
			</span>
		</Chip>
		<h1
			tabindex="-1"
			class="font-display text-focus m-0 text-[32px] leading-tight font-normal uppercase outline-none sm:text-[38px]"
			style:text-shadow="-2.5px 0 0 var(--color-magenta), 2.5px 0 0 var(--color-accent), {headline.glow}"
			data-end={perfect ? 'perfect' : endReason}
		>
			{headline.text}
		</h1>
		{#if poolCleared}
			<p class="text-ink-muted max-w-[320px] text-[15px]">
				{perfect ? ts('result.perfectRunHint') : ts('result.poolClearedHint')}
			</p>
		{/if}
		<p class="font-ui tabular flex items-baseline gap-2 font-bold">
			<span
				class="text-score text-[40px] leading-none tracking-[1px] [text-shadow:0_0_14px_rgb(255_200_87/0.5)]"
				>{formatNumber(gameState.totalScore)}</span
			>
			<span class="text-ink-muted text-base">{ts('hud.creditsShort')}</span>
		</p>
		{#if rank}
			<p class="text-pink text-sm">{rank}</p>
		{/if}
	</section>

	<dl class="grid grid-cols-4 gap-1.5">
		{#each stats as stat (stat.key)}
			<div
				class="rounded-control border-line bg-surface flex flex-col gap-0.5 border px-2 py-2 sm:px-2.5"
			>
				<dt
					class="font-ui text-ink-muted text-[11px] leading-tight font-bold tracking-[1px] uppercase"
				>
					<span aria-hidden="true">{stat.short}</span>
					<span class="sr-only">{stat.label}</span>
				</dt>
				<dd class="font-ui tabular m-0 text-[22px] font-bold {stat.tone}">{stat.value}</dd>
			</div>
		{/each}
	</dl>

	<div class="flex gap-2">
		<Button class="flex-1" onclick={restartGame}>{ts('result.playAgain')}</Button>
		<Button variant="secondary" class="px-4.5" onclick={resetGame}>{ts('result.mainMenu')}</Button>
	</div>

	{#if perfect}
		<!-- The striped synthwave sun on its horizon: decoration only, between the actions and the board -->
		<div aria-hidden="true" class="relative -mx-4 flex h-28 justify-center overflow-hidden">
			<HorizonGrid class="absolute inset-x-0 bottom-0 h-20 w-full" fade={false} />
			<svg viewBox="0 0 220 110" class="relative h-full opacity-55">
				<circle cx="110" cy="110" r="100" fill="var(--color-coin)" />
				<g fill="var(--color-bg)">
					<rect x="0" y="62" width="220" height="5" />
					<rect x="0" y="78" width="220" height="7" />
					<rect x="0" y="94" width="220" height="9" />
				</g>
			</svg>
		</div>
	{/if}

	<div class="mt-2">
		<Leaderboard
			entries={leaderboardEntries}
			mode={gameState.mode}
			{highlightIndex}
			id="result-board"
		/>
	</div>

	<!-- Every card of the run, misses framed red and marked ✗ (U16) -->
	<section class="mt-2" aria-labelledby="result-timeline">
		<div class="mb-2 flex items-baseline justify-between gap-3">
			<h2
				id="result-timeline"
				class="font-ui text-ink m-0 text-sm font-bold tracking-[1.5px] uppercase"
			>
				{tf<(n: number) => string>('result.yourTimeline')(gameState.timeline.length)}
			</h2>
			{#if missed.size > 0}
				<span class="text-danger text-[13px]" aria-hidden="true">{ts('result.missedLegend')}</span>
			{/if}
		</div>
		<ol class="flex flex-col gap-1">
			{#each rows as game (game.id)}
				<li>
					<TimelineRow {game} compact status={missed.has(game.id) ? 'missed' : 'settled'} />
				</li>
			{/each}
		</ol>
		{#if hiddenRows > 0}
			<button
				type="button"
				onclick={() => (showAll = true)}
				class="focus-ring rounded-control border-line-strong text-ink-muted hover:text-ink hover:border-accent mt-1 flex h-10 w-full items-center justify-center border border-dashed text-sm transition-colors duration-(--duration-fast)"
			>
				{tf<(n: number) => string>('result.more')(hiddenRows)}
			</button>
		{/if}
	</section>
</div>
