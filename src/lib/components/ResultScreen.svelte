<script lang="ts">
	import { getState, nameFinishedRun, resetGame, restartGame } from '$lib/game.svelte';
	import { getPlayerName, markNameAsked, shouldAskName } from '$lib/player.svelte';
	import { addLeaderboardEntry } from '$lib/leaderboard';
	import { isPerfectRun } from '$lib/placement';
	import { formatNumber, tf, ts } from '$lib/i18n.svelte';
	import type { LeaderboardEntry } from '$lib/types';
	import { resolve } from '$app/paths';
	import DailyMarks from './DailyMarks.svelte';
	import Leaderboard from './Leaderboard.svelte';
	import PlayerNameForm from './PlayerNameForm.svelte';
	import TimelineRow from './TimelineRow.svelte';
	import Button from './ui/Button.svelte';
	import Chip from './ui/Chip.svelte';
	import HorizonGrid from './ui/HorizonGrid.svelte';
	import Surface from './ui/Surface.svelte';

	// The final timeline shows this many rows before "+ N more"; one more than that shows all
	const RESULT_ROWS = 14;

	const gameState = $derived(getState());

	const endReason = $derived(gameState.endReason ?? 'outOfLives');
	const perfect = $derived(isPerfectRun(endReason, gameState.wrongPlacements));
	const poolCleared = $derived(endReason === 'poolCleared');
	// A Daily Run (10d) ends after its tenth card: "pool cleared" means it was played through
	const daily = $derived(gameState.daily);

	// The headline's glow says how the run ended: red, turquoise, gold
	const headline = $derived(
		perfect
			? {
					text: daily ? ts('daily.perfect') : ts('result.perfectRun'),
					glow: '0 0 16px rgb(255 200 87 / 0.8)'
				}
			: poolCleared
				? {
						text: daily ? ts('daily.complete') : ts('result.poolCleared'),
						glow: '0 0 16px rgb(63 240 228 / 0.8)'
					}
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

	// This device on the global board, as the server answered the run's end (10c). Without it
	// (it could not be worked out), the rank among this device's own runs, as before
	const standing = $derived(gameState.standing);
	const newBest = $derived(
		standing !== null &&
			standing.previousBest !== null &&
			gameState.totalScore > standing.previousBest
	);
	const localRank = $derived(
		highlightIndex === 0 && leaderboardEntries.length > 1
			? ts('result.personalBest')
			: highlightIndex > 0
				? tf<(n: number) => string>('result.rank')(highlightIndex + 1)
				: null
	);
	const rank = $derived(
		standing?.scope === 'today'
			? tf<(rank: number, players: number) => string>('daily.place')(
					standing.rank,
					standing.players
				)
			: standing === null
				? daily
					? null
					: localRank
				: [
						newBest
							? ts('result.personalBest')
							: standing.previousBest !== null
								? tf<(s: string) => string>('result.yourBest')(formatNumber(standing.best))
								: null,
						tf<(rank: number, players: number) => string>('result.globalRank')(
							standing.rank,
							standing.players
						)
					]
						.filter(Boolean)
						.join(' · ')
	);

	// The name is asked once, after the first finished run (10c-1): decided when the screen
	// opens, and remembered at once, so ignoring the question and playing again doesn't repeat it
	const askName = shouldAskName();
	if (askName) markNameAsked();
	let nameOpen: boolean = $state(askName);
	let savedName: string | null = $state(null);
	const playerName = $derived(getPlayerName());

	async function saveName(name: string) {
		const outcome = await nameFinishedRun(name);
		if (outcome === 'saved') {
			savedName = name;
			nameOpen = false;
		}
		return outcome;
	}

	function notNow() {
		nameOpen = false;
	}

	$effect(() => {
		// A Daily Run is not an endless run: it stays off this device's endless lists
		if (!saved && !daily) {
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

			// The global board needs nothing from here: the server wrote this run's score when it
			// ended it (Sprint 10b)
		}
	});
</script>

<div class="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 pt-4 pb-10">
	<!-- The outcome, then the actions: Play again sits above the fold after any run (U15) -->
	<section class="flex flex-col items-center gap-2.5 text-center">
		<Chip tone={gameState.mode === 'pro' || daily ? 'pink' : 'accent'} size="sm">
			<span data-run-mode={daily ? 'daily' : gameState.mode}>
				{daily
					? tf<(n: number) => string>('daily.title')(daily.number)
					: gameState.mode === 'pro'
						? ts('mode.pro')
						: ts('mode.normal')}
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
		{#if poolCleared && !daily}
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
		{#if daily && gameState.marks}
			<DailyMarks marks={gameState.marks} />
		{/if}
		{#if rank}
			<p class="text-pink text-sm" data-standing={standing ? 'global' : 'local'}>{rank}</p>
		{/if}
		{#if savedName}
			<p class="text-accent text-sm" role="status">
				{tf<(name: string) => string>('name.saved')(savedName)}
			</p>
		{:else if playerName && !nameOpen}
			<p class="text-ink-muted text-sm">
				{tf<(name: string) => string>('result.playingAs')(playerName)}
			</p>
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
		{#if daily}
			<!-- One try a day: no Play again, but today's board -->
			<a
				href="{resolve('/leaderboard')}?mode=daily"
				class="focus-ring rounded-control bg-pink text-on-accent shadow-glow-card font-ui flex min-h-13 flex-1 items-center justify-center px-6 text-[15px] font-bold tracking-[2px] uppercase transition-colors duration-(--duration-fast) hover:bg-[#ff7ae6]"
			>
				{ts('daily.board')}
			</a>
		{:else}
			<Button class="flex-1" onclick={restartGame}>{ts('result.playAgain')}</Button>
		{/if}
		<Button variant="secondary" class="px-4.5" onclick={resetGame}>{ts('result.mainMenu')}</Button>
	</div>

	<!-- After the actions: Play again stays above the fold (U15) -->
	{#if nameOpen}
		<Surface as="section" frame="line" padding="md" class="flex flex-col gap-3">
			<h2 class="font-ui text-pink m-0 text-sm font-bold tracking-[2px] uppercase">
				{ts('name.title')}
			</h2>
			<p class="text-ink-muted text-sm">{ts('name.hint')}</p>
			<PlayerNameForm
				id="result-name"
				onsave={saveName}
				cancelLabel={ts('name.notNow')}
				oncancel={notNow}
			/>
		</Surface>
	{/if}

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

	{#if !daily}
		<div class="mt-2">
			<Leaderboard
				entries={leaderboardEntries}
				mode={gameState.mode}
				{highlightIndex}
				id="result-board"
			/>
		</div>
	{/if}

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
