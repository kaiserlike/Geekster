<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BonusGuessPanel from '$lib/components/BonusGuessPanel.svelte';
	import DecadeRuler from '$lib/components/DecadeRuler.svelte';
	import RunHud from '$lib/components/RunHud.svelte';
	import ScoreReveal from '$lib/components/ScoreReveal.svelte';
	import TimelineRow from '$lib/components/TimelineRow.svelte';
	import TimelineSlot from '$lib/components/TimelineSlot.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import HorizonGrid from '$lib/components/ui/HorizonGrid.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import IconMark from '$lib/components/ui/IconMark.svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import Surface from '$lib/components/ui/Surface.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import Wordmark from '$lib/components/ui/Wordmark.svelte';
	import CreditCoin from '$lib/components/ui/icons/CreditCoin.svelte';
	import Heart from '$lib/components/ui/icons/Heart.svelte';
	import { BRAND_ASSETS } from '$lib/brand';
	import { DURATION, fly } from '$lib/motion';
	import {
		applyPlacement,
		decadeBuckets,
		hudMoment,
		MAX_LIVES,
		type HudMoment
	} from '$lib/placement';
	import type { Game, RoundScore, SegmentOption, ToastMessage } from '$lib/types';

	/*
	 * The living styleguide (Sprint 9b): every primitive in every state, rendered from the real
	 * components so it cannot drift. Not linked from anywhere, and noindex. Hover and focus are
	 * live: move the pointer, or Tab through the page.
	 */

	const COLOR_TOKENS: { name: string; use: string }[] = [
		{ name: 'bg', use: 'page ground' },
		{ name: 'surface', use: 'HUD, bonus panel, leaderboard' },
		{ name: 'surface-raised', use: 'timeline rows, icon buttons' },
		{ name: 'surface-sunken', use: 'slots, secondary buttons' },
		{ name: 'accent-soft', use: 'selected tab, drop target, correct toast' },
		{ name: 'line', use: 'dividers only · 2.2' },
		{ name: 'line-strong', use: 'every control border · 4.4 on surface' },
		{ name: 'ink', use: 'text · 18.0' },
		{ name: 'ink-muted', use: 'secondary text · 10.7' },
		{ name: 'ink-subtle', use: 'disabled · 6.1' },
		{ name: 'accent', use: 'primary, streak bar, Normal · 13.5' },
		{ name: 'accent-strong', use: 'years, STREAK N · 14.4' },
		{ name: 'on-accent', use: 'text on accent, pink, magenta' },
		{ name: 'focus', use: '2 px ring, 2 px gap · 18.8' },
		{ name: 'magenta', use: 'borders and glow only · 6.0' },
		{ name: 'pink', use: 'tagline, labels, PRO, NEW · 8.4' },
		{ name: 'life', use: 'hearts · 5.8' },
		{ name: 'life-empty', use: 'a lost heart · 3.7 on surface' },
		{ name: 'danger', use: 'wrong, misses, timer ≤ 5 s · 6.0' },
		{ name: 'danger-soft', use: 'wrong fills' },
		{ name: 'score', use: 'credits · 14.2' },
		{ name: 'coin', use: 'the credit coin' },
		{ name: 'coin-rim', use: 'the coin rim' },
		{ name: 'grid', use: 'the horizon grid, decoration' }
	];

	// Read back from the computed style, so the page shows what app.css says, not a copy of it
	let resolved: Record<string, string> = $state({});
	onMount(() => {
		const style = getComputedStyle(document.documentElement);
		resolved = Object.fromEntries(
			COLOR_TOKENS.map(({ name }) => [name, style.getPropertyValue(`--color-${name}`).trim()])
		);
	});

	type Mode = 'normal' | 'pro';
	let gatedMode: Mode = $state('normal');
	let openMode: Mode = $state('pro');
	const gatedOptions: SegmentOption<Mode>[] = [
		{ value: 'normal', label: 'Normal' },
		{ value: 'pro', label: 'Pro', tone: 'pink', disabled: true, badge: 'Coming soon' }
	];
	const openOptions: SegmentOption<Mode>[] = [
		{ value: 'normal', label: 'Normal' },
		{ value: 'pro', label: 'Pro', tone: 'pink' }
	];

	const TOASTS: ToastMessage[] = [
		{ tone: 'correct', title: 'Correct', detail: '+100 · streak 8' },
		{ tone: 'wrong', title: 'Wrong', detail: 'Portal is from 2007 · −1 life' },
		{ tone: 'life', title: '10 in a row', detail: '+1 life won back' },
		{ tone: 'streak', title: '10 in a row', detail: 'Lives already full · ×1.5 holds' }
	];
	let liveToast: ToastMessage | null = $state(null);
	let toastIndex = 0;
	function announce() {
		liveToast = { ...TOASTS[toastIndex % TOASTS.length] };
		toastIndex++;
	}

	// The HUD's states, drawn from the same props the game passes
	const HUD_STATES: {
		caption: string;
		lives: number;
		streak: number;
		score: number;
		moment: HudMoment;
	}[] = [
		{ caption: 'a life missing · streak 7', lives: 2, streak: 7, score: 2340, moment: 'none' },
		{ caption: 'lives full · streak 7', lives: 3, streak: 7, score: 2340, moment: 'none' },
		{ caption: 'streak 10 · life back', lives: 3, streak: 10, score: 3480, moment: 'lifeBack' },
		{ caption: 'streak 20 · lives full', lives: 3, streak: 20, score: 6120, moment: 'tenInARow' },
		{ caption: 'wrong placement', lives: 1, streak: 0, score: 2340, moment: 'wrong' },
		{ caption: 'start of a run', lives: 3, streak: 0, score: 0, moment: 'none' }
	];

	// A live HUD played with the real rules: the moments animate, the credits count up
	let demo = $state({
		lives: 2,
		streak: 7,
		bestStreak: 7,
		livesWonBack: 0,
		score: 2340,
		moment: 'none' as HudMoment
	});
	function play(correct: boolean) {
		const next = applyPlacement({ ...demo, maxLives: MAX_LIVES }, correct);
		const lives = Math.max(next.lives, 1);
		demo = {
			lives,
			streak: next.streak,
			bestStreak: next.bestStreak,
			livesWonBack: next.livesWonBack,
			score: demo.score + (correct ? 150 : 0),
			moment: hudMoment(correct, next.streak, next.lifeRegained)
		};
	}
	function toNine() {
		demo = { ...demo, streak: 9, moment: 'none' };
	}
	let hudCompact = $state(false);

	// The playing screen (9d): seed screenshots, so the page needs no database
	const SAMPLE: Game[] = [
		{ id: 1, name: 'Super Mario 64', year: 1996, screenshot: '/screenshots/super-mario-64.webp' },
		{ id: 2, name: 'Half-Life 2', year: 2004, screenshot: '/screenshots/half-life-2.webp' },
		{ id: 3, name: 'The Last of Us', year: 2013, screenshot: '/screenshots/the-last-of-us.webp' }
	];
	const ROW_STATES: { status: 'settled' | 'hidden' | 'placed' | 'misplaced'; caption: string }[] = [
		{ status: 'settled', caption: 'settled · year first' },
		{ status: 'hidden', caption: 'just placed, during the bonus guess' },
		{ status: 'placed', caption: 'just placed, revealed' },
		{ status: 'misplaced', caption: 'a miss, where it belongs' }
	];
	const RULER = decadeBuckets(
		[1985, 1989, 1991, 1994, 1996, 1998, 1999, 2001, 2004, 2008, 2013, 2021].map((year) => ({
			year
		}))
	);
	let rulerCurrent: number | null = $state(1990);
	const round = (over: Partial<RoundScore>): RoundScore => ({
		base: 100,
		yearBonus: 30,
		nameBonus: 50,
		streakMultiplier: 1.5,
		total: 270,
		yearGuess: 2006,
		nameGuess: 'portal',
		actualYear: 2007,
		actualName: 'Portal',
		placementCorrect: true,
		...over
	});
	const REVEALS: { caption: string; score: RoundScore; streak: number }[] = [
		{ caption: 'exact · close · streak ×1.5', score: round({}), streak: 8 },
		{
			caption: 'nope · skipped · no multiplier',
			score: round({
				yearBonus: 0,
				yearGuess: 1994,
				nameBonus: 0,
				nameGuess: null,
				streakMultiplier: 1,
				total: 100
			}),
			streak: 1
		}
	];
	let revealKey = $state(0);
	let bonusShown = $state(false);
	let bonusResult = $state('');

	let year = $state('');
	let name = $state('Half-Life 2');
	let showMotion = $state(true);
	let loading = $state(false);
	function pretendToLoad() {
		loading = true;
		setTimeout(() => (loading = false), 1500);
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
	<title>Styleguide — Geekster</title>
</svelte:head>

{#snippet heading(text: string)}
	<h2 class="font-ui text-pink mb-4 text-[15px] font-bold tracking-[3px] uppercase">{text}</h2>
{/snippet}

{#snippet caption(text: string)}
	<span class="font-ui text-ink-muted text-xs tracking-[1px]">{text}</span>
{/snippet}

<main class="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 lg:px-10">
	<div class="flex flex-col gap-2 pt-6">
		<Wordmark size={44} tagline heading />
		<p class="text-ink-muted text-center text-[15px]">
			Styleguide · every primitive in every state, from the real components. The code is the source
			of truth: <code class="font-ui text-accent">src/app.css</code> and this page.
		</p>
	</div>

	<Surface as="section" padding="lg">
		{@render heading('Colour')}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
			{#each COLOR_TOKENS as token (token.name)}
				<div class="flex flex-col gap-1.5">
					<div
						class="rounded-control border-line-strong h-14 border"
						style:background="var(--color-{token.name})"
					></div>
					<span class="font-ui text-[13px] font-bold">{token.name}</span>
					<span class="tabular text-ink-muted text-xs">
						{resolved[token.name] ?? '…'} · {token.use}
					</span>
				</div>
			{/each}
		</div>
	</Surface>

	<div class="grid gap-6 lg:grid-cols-2">
		<Surface as="section" padding="lg">
			{@render heading('Type')}
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<span class="font-display text-shadow-split text-[38px] leading-tight">Game over</span>
					{@render caption('font-display · Dela Gothic One · headlines 24/32/38')}
				</div>
				<div class="flex flex-col gap-1">
					<span class="tabular font-ui text-accent-strong text-[22px] font-bold tracking-[1.5px]">
						STREAK 7 · 2013
					</span>
					{@render caption('font-ui · Chakra Petch 500/700 · labels, buttons, every number')}
				</div>
				<div class="flex flex-col gap-1">
					<span class="text-[17px] leading-normal">Place every screenshot on the timeline.</span>
					<span class="text-ink-muted text-[15px] leading-normal font-medium">
						Body 15 in 500, muted.
					</span>
					<span class="text-[13px] leading-normal font-semibold">Body 13 in 600.</span>
					{@render caption('font-body · Exo 2 400/500/600 · 13/15/17, line-height 1.5')}
				</div>
			</div>
		</Surface>

		<Surface as="section" padding="lg">
			{@render heading('Radius · effects')}
			<div class="flex flex-wrap items-end gap-4">
				<div class="flex flex-col gap-1.5">
					<div class="rounded-chip border-line-strong h-8 w-11 border-[1.5px]"></div>
					{@render caption('chip 4')}
				</div>
				<div class="flex flex-col gap-1.5">
					<div class="rounded-thumb border-line-strong h-8 w-11 border-[1.5px]"></div>
					{@render caption('thumb 6')}
				</div>
				<div class="flex flex-col gap-1.5">
					<div class="rounded-control border-line-strong h-8 w-11 border-[1.5px]"></div>
					{@render caption('control 8')}
				</div>
				<div class="flex flex-col gap-1.5">
					<div class="rounded-card border-line-strong h-8 w-11 border-[1.5px]"></div>
					{@render caption('card 10')}
				</div>
			</div>
			<div class="mt-6 flex flex-wrap items-end gap-6">
				<div class="flex flex-col gap-1.5">
					<div class="rounded-control bg-accent shadow-glow-accent h-9 w-14"></div>
					{@render caption('glow-accent')}
				</div>
				<div class="flex flex-col gap-1.5">
					<div
						class="rounded-control border-magenta bg-surface shadow-glow-magenta h-9 w-14 border-[1.5px]"
					></div>
					{@render caption('glow-magenta')}
				</div>
				<div class="flex flex-col gap-1.5">
					<div
						class="rounded-card border-accent bg-surface shadow-glow-card h-9 w-14 border-2"
					></div>
					{@render caption('glow-card')}
				</div>
			</div>
			<div class="rounded-control border-line relative mt-6 h-24 overflow-hidden border">
				<HorizonGrid class="absolute bottom-0 left-0 h-full w-full" />
			</div>
			{@render caption('horizon grid · opacity 0.3, blur 0.5 px, top-third fade')}
		</Surface>
	</div>

	<Surface as="section" padding="lg">
		{@render heading('Button')}
		<div class="flex flex-wrap items-start gap-4">
			<div class="flex flex-col items-start gap-1.5">
				<Button size="lg">Start run</Button>
				{@render caption('primary · lg 56')}
			</div>
			<div class="flex flex-col items-start gap-1.5">
				<Button>Play again</Button>
				{@render caption('primary · md 52')}
			</div>
			<div class="flex flex-col items-start gap-1.5">
				<Button size="sm">Next card</Button>
				{@render caption('primary · sm 44')}
			</div>
			<div class="flex flex-col items-start gap-1.5">
				<Button {loading} onclick={pretendToLoad}>{loading ? 'Loading' : 'Click me'}</Button>
				{@render caption('loading (click)')}
			</div>
			<div class="flex flex-col items-start gap-1.5">
				<Button disabled>Start run</Button>
				{@render caption('disabled')}
			</div>
			<div class="flex flex-col items-start gap-1.5">
				<Button variant="secondary">Menu</Button>
				{@render caption('secondary')}
			</div>
			<div class="flex flex-col items-start gap-1.5">
				<Button variant="secondary" disabled>Menu</Button>
				{@render caption('secondary disabled')}
			</div>
			<div class="flex flex-col items-start gap-1.5">
				<Button variant="ghost" size="sm">How to play ▸</Button>
				{@render caption('ghost')}
			</div>
			<div class="flex flex-col items-start gap-1.5">
				<Button variant="ghost" size="sm" disabled>How to play ▸</Button>
				{@render caption('ghost disabled')}
			</div>
		</div>
		<div class="mt-4 max-w-sm">
			<Button size="lg" fullWidth>Start run</Button>
			{@render caption('fullWidth, as on a phone')}
		</div>
	</Surface>

	<div class="grid gap-6 lg:grid-cols-2">
		<Surface as="section" padding="lg">
			{@render heading('IconButton · Chip')}
			<div class="flex flex-wrap items-center gap-3">
				<IconButton label="Switch to English">EN</IconButton>
				<IconButton label="Menu">
					<svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
						<path
							d="M1 2h16M1 7h16M1 12h16"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				</IconButton>
				<IconButton label="Disabled" disabled>DE</IconButton>
			</div>
			<div class="mt-5 flex flex-wrap items-center gap-3">
				<Chip>Normal</Chip>
				<Chip tone="pink">Pro</Chip>
				<Chip tone="multiplier" size="md">×1.5</Chip>
				<Chip tone="neutral" size="md">×1.0</Chip>
				<Chip tone="pink" size="xs">New</Chip>
				<Chip tone="pink" size="xs">Coming soon</Chip>
				<Chip tone="mystery" size="md">????</Chip>
			</div>
		</Surface>

		<Surface as="section" padding="lg">
			{@render heading('Icons')}
			<div class="flex flex-wrap items-end gap-5">
				<div class="flex flex-col items-center gap-1.5">
					<Heart />
					{@render caption('full')}
				</div>
				<div class="flex flex-col items-center gap-1.5">
					<Heart variant="empty" />
					{@render caption('empty')}
				</div>
				<div class="flex flex-col items-center gap-1.5">
					<Heart variant="socket" />
					{@render caption('socket')}
				</div>
				<div class="flex flex-col items-center gap-1.5">
					<Heart variant="broken" />
					{@render caption('broken')}
				</div>
				<div class="flex flex-col items-center gap-1.5">
					<CreditCoin />
					{@render caption('coin 20')}
				</div>
				<div class="flex flex-col items-center gap-1.5">
					<CreditCoin size={96} label="Credit coin" />
					{@render caption('coin 96')}
				</div>
				<span class="tabular font-ui text-score text-2xl font-bold">
					2,340 <span class="text-ink-muted text-[13px]">CR</span>
				</span>
			</div>
		</Surface>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<Surface as="section" padding="lg">
			{@render heading('TextField')}
			<div class="flex flex-col gap-4">
				<TextField
					id="sg-year"
					label="Year"
					bind:value={year}
					inputmode="numeric"
					maxlength={4}
					placeholder="2004"
					hint="Four digits"
				/>
				<TextField id="sg-name" label="Name" bind:value={name} />
				<TextField id="sg-error" label="Year" value="20" error="Four digits, please" />
				<TextField id="sg-disabled" label="Name" value="Locked" disabled />
			</div>
		</Surface>

		<Surface as="section" padding="lg">
			{@render heading('SegmentedControl')}
			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-1.5">
					<SegmentedControl
						legend="Mode"
						name="sg-gated"
						options={gatedOptions}
						value={gatedMode}
						onchange={(value) => (gatedMode = value)}
					/>
					{@render caption('Pro gated')}
				</div>
				<div class="flex flex-col gap-1.5">
					<SegmentedControl
						legend="Mode"
						name="sg-open"
						options={openOptions}
						value={openMode}
						onchange={(value) => (openMode = value)}
					/>
					{@render caption('Pro open: selected Pro takes pink')}
				</div>
				<SegmentedControl
					legend="Disabled while loading"
					name="sg-disabled"
					options={openOptions}
					value="normal"
					onchange={() => {}}
					disabled
				/>
			</div>
		</Surface>
	</div>

	<Surface as="section" padding="lg">
		{@render heading('Toast · polite live region, in the flow under the HUD')}
		<div class="grid gap-2.5 lg:grid-cols-2">
			{#each TOASTS as toast, i (i)}
				<Toast message={toast} />
			{/each}
		</div>
		<div class="mt-5 flex flex-col items-start gap-3">
			<Button size="sm" variant="secondary" onclick={announce}>Announce the next one</Button>
			<Toast message={liveToast} class="w-full max-w-lg" />
		</div>
	</Surface>

	<Surface as="section" padding="lg">
		{@render heading('Surface')}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Surface>surface · line</Surface>
			<Surface tone="raised">raised</Surface>
			<Surface tone="sunken">sunken</Surface>
			<Surface frame="none">no frame</Surface>
			<Surface frame="magenta">magenta (the HUD)</Surface>
			<Surface frame="danger">danger (a wrong moment)</Surface>
			<Surface frame="danger-glow">danger-glow (the HUD, wrong)</Surface>
			<Surface frame="life-glow">life-glow (the HUD, a life back)</Surface>
		</div>
	</Surface>

	<Surface as="section" padding="lg">
		{@render heading('Motion')}
		<p class="text-ink-muted mb-4 text-[15px]">
			fast {DURATION.fast} · base {DURATION.base} · slow {DURATION.slow} · reveal
			{DURATION.reveal} ms. With reduced motion every transition from
			<code class="font-ui text-accent">$lib/motion</code> is a fade of at most {DURATION.fast} ms.
		</p>
		<Button size="sm" variant="secondary" onclick={() => (showMotion = !showMotion)}>
			{showMotion ? 'Hide' : 'Show'}
		</Button>
		<div class="mt-4 h-16">
			{#if showMotion}
				<div
					transition:fly={{ y: 24, duration: DURATION.slow }}
					class="rounded-control bg-accent-soft font-ui inline-flex px-4 py-3 font-bold"
				>
					fly · slow · ease-out
				</div>
			{/if}
		</div>
	</Surface>

	<Surface as="section" padding="lg">
		{@render heading('Brand')}
		<div class="flex flex-col gap-6">
			<!-- The 68 px wordmark is the desktop welcome size: wider than a phone, so it scrolls here -->
			<div class="flex flex-wrap items-end gap-8 overflow-x-auto">
				<Wordmark size={68} tagline />
				<Wordmark size={44} tagline />
				<Wordmark size={27} />
				<div class="flex flex-col gap-1.5">
					<Wordmark size={27} flat />
					{@render caption('flat')}
				</div>
			</div>
			<div class="flex flex-wrap items-end gap-6">
				{#each BRAND_ASSETS as asset (asset.id)}
					{#if asset.icon}
						<a
							href={resolve('/styleguide/brand/[asset]', { asset: asset.id })}
							class="focus-ring rounded-control flex flex-col items-center gap-1.5"
						>
							<IconMark size={Math.min(asset.width, 192)} fill={asset.icon} />
							{@render caption(`${asset.id} · ${asset.width}`)}
						</a>
					{/if}
				{/each}
				<a
					href={resolve('/styleguide/brand/[asset]', { asset: 'og-image' })}
					class="focus-ring font-ui text-accent text-sm font-bold underline"
				>
					og-image · 1200×630 ▸
				</a>
			</div>
		</div>
	</Surface>

	<Surface as="section" padding="none" class="overflow-hidden">
		<div class="p-6 pb-2">{@render heading('AppHeader')}</div>
		<AppHeader />
		<AppHeader pro />
		<AppHeader pro score={2340} />
		<div class="px-6 pb-4">
			{@render caption(
				'plain · during a Pro run · the HUD collapsed into it (bonus keyboard open)'
			)}
		</div>
	</Surface>

	<Surface as="section" padding="lg">
		{@render heading('RunHud · StreakMeter')}
		<div class="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each HUD_STATES as hud (hud.caption)}
				<div class="flex flex-col gap-1.5">
					<RunHud
						lives={hud.lives}
						maxLives={MAX_LIVES}
						streak={hud.streak}
						totalScore={hud.score}
						moment={hud.moment}
					/>
					{@render caption(hud.caption)}
				</div>
			{/each}
		</div>
		<div class="mt-6 flex flex-col gap-1.5">
			<RunHud lives={2} maxLives={MAX_LIVES} streak={7} totalScore={2340} compact />
			{@render caption('compact · one line while dragging')}
		</div>
		<div class="mt-8 flex max-w-md flex-col gap-3">
			{@render caption('live, with the real rules: the moments animate, the credits count up')}
			<RunHud
				lives={demo.lives}
				maxLives={MAX_LIVES}
				streak={demo.streak}
				totalScore={demo.score}
				moment={demo.moment}
				compact={hudCompact}
			/>
			<div class="flex flex-wrap gap-2">
				<Button size="sm" onclick={() => play(true)}>Correct</Button>
				<Button size="sm" variant="secondary" onclick={() => play(false)}>Wrong</Button>
				<Button size="sm" variant="secondary" onclick={toNine}>Streak 9</Button>
				<Button size="sm" variant="ghost" onclick={() => (hudCompact = !hudCompact)}>
					{hudCompact ? 'Full' : 'Compact'}
				</Button>
			</div>
		</div>
	</Surface>

	<Surface as="section" padding="lg">
		{@render heading('TimelineSlot · TimelineRow · DecadeRuler')}
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="flex flex-col gap-2">
				<TimelineSlot onPlace={() => {}} slotIndex={-1} label="Place here, idle" />
				{@render caption('idle · hover · Tab for the focus ring')}
				<TimelineSlot onPlace={() => {}} slotIndex={-1} label="Place here" expanded />
				{@render caption('while dragging: 60 px')}
				<TimelineSlot onPlace={() => {}} slotIndex={-1} label="Place here" expanded highlighted />
				{@render caption('the drop target')}
				<TimelineSlot onPlace={() => {}} slotIndex={-1} label="Place here" compact />
				{@render caption('compact timeline: 36 px on desktop, 44 on a phone')}
			</div>
			<div class="flex flex-col gap-2">
				{#each ROW_STATES as row (row.status)}
					<TimelineRow game={SAMPLE[1]} status={row.status} />
					{@render caption(row.caption)}
				{/each}
				<TimelineRow game={SAMPLE[2]} compact />
				{@render caption('compact, past COMPACT_TIMELINE_AT')}
				<div
					class="rounded-control border-danger font-ui text-danger flex h-11 items-center justify-center gap-2 border-2 border-dashed bg-[#1a0a12] text-[13px] font-bold tracking-[1.5px] uppercase"
				>
					<span aria-hidden="true">✗</span> You put it here
				</div>
				{@render caption('the ghost of a miss')}
			</div>
		</div>
		<div class="mt-6 flex items-start gap-6">
			<div class="flex h-80 w-18 flex-col">
				<DecadeRuler
					buckets={RULER}
					current={rulerCurrent}
					anchorId={(d) => `sg-decade-${d}`}
					onJump={(d) => (rulerCurrent = d)}
				/>
			</div>
			{@render caption('the decade ruler (desktop): heights by count, ≥ 44 px, click to select')}
		</div>
	</Surface>

	<Surface as="section" padding="lg">
		{@render heading('BonusGuessPanel · ScoreReveal')}
		<div class="grid gap-6 lg:grid-cols-3">
			<div class="flex flex-col gap-2">
				{#if bonusShown}
					<BonusGuessPanel
						onSubmit={(y, n) => {
							bonusResult = `year ${y ?? '—'} · name ${n ?? '—'}`;
							bonusShown = false;
						}}
						onSkip={() => {
							bonusResult = 'skipped';
							bonusShown = false;
						}}
					/>
				{:else}
					<Button size="sm" onclick={() => (bonusShown = true)}>Start a bonus round</Button>
				{/if}
				{@render caption(
					`live: 30 s, announced at 10 and 5, red from 5${bonusResult ? ` · last: ${bonusResult}` : ''}`
				)}
			</div>
			{#key revealKey}
				{#each REVEALS as reveal (reveal.caption)}
					<div class="flex flex-col gap-2">
						<ScoreReveal
							roundScore={reveal.score}
							screenshot="/screenshots/portal.webp"
							streak={reveal.streak}
						/>
						{@render caption(reveal.caption)}
					</div>
				{/each}
			{/key}
		</div>
		<Button size="sm" variant="ghost" class="mt-3" onclick={() => revealKey++}
			>Replay the reveal</Button
		>
	</Surface>
</main>
