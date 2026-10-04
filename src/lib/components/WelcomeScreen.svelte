<script lang="ts">
	import { untrack } from 'svelte';
	import { getState, startGame } from '$lib/game.svelte';
	import { getLeaderboard, hasPlayedBefore } from '$lib/leaderboard';
	import { loadStoredMode, playableMode, storeMode, type ProGate } from '$lib/modes';
	import { formatNumber, tk, ts } from '$lib/i18n.svelte';
	import type { DailyStatus, Difficulty, Game, LeaderboardEntry } from '$lib/types';
	import { getDeviceId } from '$lib/player.svelte';
	import DailyCard from './DailyCard.svelte';
	import HowToPlay from './HowToPlay.svelte';
	import Leaderboard from './Leaderboard.svelte';
	import ModeChoice from './ModeChoice.svelte';
	import TimelineRow from './TimelineRow.svelte';
	import Button from './ui/Button.svelte';
	import Chip from './ui/Chip.svelte';
	import HorizonGrid from './ui/HorizonGrid.svelte';
	import Surface from './ui/Surface.svelte';
	import Wordmark from './ui/Wordmark.svelte';

	interface Props {
		proGate: ProGate;
	}

	let { proGate }: Props = $props();

	// Rows on the welcome screen's board: a glance, the result screen has the longer list
	const WELCOME_ROWS = 5;
	// The desktop's decoration, from the seed screenshots in static/ (no database needed)
	const DECO: Game[] = [
		{ id: -1, name: 'Super Mario 64', year: 1996, screenshot: '/screenshots/super-mario-64.webp' },
		{ id: -2, name: 'Kingdom Hearts', year: 2002, screenshot: '/screenshots/kingdom-hearts.webp' },
		{ id: -3, name: 'The Last of Us', year: 2013, screenshot: '/screenshots/the-last-of-us.webp' }
	];
	const DECO_CARD = '/screenshots/portal.webp';

	const gameState = $derived(getState());

	// The stored choice and the local lists live in this browser only. Both are read after
	// hydration, so the server's HTML (a first visit, Normal) and the first client render agree.
	let chosen: Difficulty = $state('normal');
	let hydrated: boolean = $state(false);

	// Falls back to the last run's mode, so "Main Menu" keeps Pro even where storage is blocked.
	$effect(() => {
		chosen = loadStoredMode(untrack(() => gameState.mode));
		hydrated = true;
	});

	// A remembered Pro choice while Pro is gated plays Normal, without an error.
	const mode = $derived(playableMode(chosen, proGate.open));

	function choose(next: Difficulty) {
		chosen = next;
		storeMode(next);
	}

	const entries: LeaderboardEntry[] = $derived(hydrated ? getLeaderboard(mode) : []);
	// A returning player gets "welcome back" and the board instead of the pitch
	const returning = $derived(hydrated && hasPlayedBefore());
	const best = $derived(entries[0]?.score ?? null);

	// Today's Daily Run for this device (10d): read in the browser, which holds the device id
	let daily: DailyStatus | 'error' | null = $state(null);
	let startingDaily: boolean = $state(false);

	async function loadDaily() {
		try {
			const res = await fetch(`/api/daily?device=${getDeviceId() ?? ''}`);
			if (!res.ok) throw new Error(`/api/daily responded ${res.status}`);
			daily = await res.json();
		} catch (err) {
			console.error('Could not load the Daily Run:', err);
			daily = 'error';
		}
	}

	$effect(() => {
		if (hydrated) untrack(loadDaily);
	});

	async function playDaily() {
		startingDaily = true;
		await startGame('daily');
		startingDaily = false;
		// Refused (played in another tab meanwhile): show today's result instead
		if (gameState.phase === 'welcome') await loadDaily();
	}
</script>

<!-- The screen fills the window; the horizon grid takes what the content leaves, never behind text -->
<div class="flex min-h-[calc(100dvh-6.5rem)] flex-col">
	<div
		class="mx-auto grid w-full max-w-[1120px] gap-x-16 gap-y-5 px-5 pt-4 pb-4 lg:flex-1 lg:grid-cols-2 lg:content-center lg:px-10"
	>
		<div class="flex flex-col gap-5 lg:col-start-1">
			<div class="flex justify-center lg:justify-start">
				<span class="lg:hidden"><Wordmark size={returning ? 40 : 44} tagline /></span>
				<span class="hidden lg:block"><Wordmark size={68} tagline /></span>
			</div>

			{#if returning}
				<h1 class="sr-only" tabindex="-1">{ts('welcome.pitch')}</h1>
				<p class="text-ink-muted text-center text-[15px] lg:text-left lg:text-[17px]">
					{#if best !== null}
						{ts('welcome.back')}
						{ts('welcome.yourBest')}
						<span class="font-ui tabular text-score font-bold whitespace-nowrap"
							>{formatNumber(best)} {ts('hud.creditsShort')}</span
						>
					{:else}
						{ts('welcome.back')}
					{/if}
				</p>
			{:else}
				<div class="flex flex-col gap-2 text-center lg:text-left">
					<h1
						tabindex="-1"
						class="font-display m-0 text-2xl leading-tight font-normal outline-none lg:text-[32px]"
					>
						{ts('welcome.pitch')}
					</h1>
					<p class="text-ink-muted text-[15px] leading-normal lg:max-w-[480px] lg:text-[17px]">
						{ts('welcome.pitchDetail')}
					</p>
				</div>
			{/if}

			{#if gameState.error}
				<Surface frame="danger" padding="sm">
					<div role="alert">
						<p class="font-ui font-bold tracking-[1.5px] uppercase">
							<span class="text-danger" aria-hidden="true">✗</span>
							{ts('error.title')}
						</p>
						<p class="text-ink-muted mt-1 text-[13px]">{tk(gameState.error)}</p>
					</div>
				</Surface>
			{/if}

			<DailyCard
				status={daily}
				starting={startingDaily}
				disabled={gameState.loading}
				onplay={playDaily}
			/>

			<Surface as="section" frame="accent" padding="none" class="flex flex-col gap-3 p-4">
				<h2 class="font-display text-ink m-0 text-[21px] leading-tight font-normal">
					{ts('endless.title')}
				</h2>
				<p class="text-ink-muted m-0 -mt-1 text-sm">{ts('endless.pitch')}</p>
				<div class="flex flex-col gap-3 lg:flex-row lg:items-start">
					<ModeChoice
						{mode}
						{proGate}
						onchoose={choose}
						disabled={gameState.loading}
						hideLegend
						class="lg:w-[260px] lg:shrink-0"
					/>
					<Button
						size="lg"
						fullWidth
						loading={gameState.loading && !startingDaily}
						disabled={gameState.loading}
						onclick={() => startGame(mode)}
						class="lg:w-auto lg:flex-1"
					>
						{#if gameState.loading && !startingDaily}
							{ts('welcome.loading')}
						{:else if gameState.error && gameState.error !== 'error.dailyPlayed'}
							{ts('error.retry')}
						{:else}
							{ts('welcome.startGame')}
						{/if}
					</Button>
				</div>
			</Surface>
		</div>

		<!--
			A returning player's board; on a first visit, the desktop shows what a run looks like. The
			server renders the first visit, and the board replaces it after hydration: the column keeps
			the decoration's height (as tall as a five-row board), so the left column doesn't move (CLS)
		-->
		<div
			class="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex lg:min-h-[484px] lg:flex-col lg:justify-center lg:self-center"
		>
			{#if returning}
				<Leaderboard {entries} {mode} limit={WELCOME_ROWS} id="welcome-board" />
			{:else}
				<div
					aria-hidden="true"
					inert
					class="hidden flex-col gap-2.5 lg:flex"
					style:transform="perspective(1200px) rotateY(-10deg)"
				>
					<TimelineRow game={DECO[0]} />
					<TimelineRow game={DECO[1]} />
					<div
						class="rounded-card border-accent shadow-glow-card relative mx-7 my-1 -rotate-2 overflow-hidden border-2"
					>
						<img src={DECO_CARD} alt="" class="block aspect-[21/9] w-full object-cover" />
						<Chip tone="mystery" size="md" class="absolute top-2.5 left-2.5">????</Chip>
					</div>
					<TimelineRow game={DECO[2]} />
				</div>
			{/if}
		</div>

		<HowToPlay class="lg:col-start-1" />
	</div>

	<div aria-hidden="true" class="relative min-h-24 flex-1 lg:max-h-60 lg:min-h-40">
		<HorizonGrid class="absolute inset-0 h-full w-full" />
	</div>
</div>
