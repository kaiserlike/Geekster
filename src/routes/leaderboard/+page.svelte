<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import PlayerNameForm from '$lib/components/PlayerNameForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import Surface from '$lib/components/ui/Surface.svelte';
	import { isBoardPeriod, parsePage, type BoardPeriod } from '$lib/globalBoard';
	import { formatNumber, formatShortDate, tf, ts } from '$lib/i18n.svelte';
	import { getDeviceId, getPlayerName, setPlayerName } from '$lib/player.svelte';
	import { isDifficulty } from '$lib/screenshotTiers';
	import type { Difficulty, GlobalBoardPage, GlobalScoreEntry } from '$lib/types';

	// The global board (Sprint 10c): each player's best run, by mode and period, a page at a time.
	// Mode, period and page live in the URL, so a link from the result screen opens the right
	// board and the back button walks the pages. The rows are fetched in the browser: only it
	// knows the device id that marks the player's own rows

	const mode: Difficulty = $derived.by(() => {
		const value = page.url.searchParams.get('mode');
		return isDifficulty(value) ? value : 'normal';
	});
	const period: BoardPeriod = $derived.by(() => {
		const value = page.url.searchParams.get('period');
		return isBoardPeriod(value) ? value : 'all';
	});
	const pageNumber = $derived(parsePage(page.url.searchParams.get('page')));

	let board: GlobalBoardPage | 'error' | null = $state(null);
	let hydrated: boolean = $state(false);
	let editingName: boolean = $state(false);

	// The stored name is read after hydration: the server render has none
	const playerName = $derived(hydrated ? getPlayerName() : null);

	onMount(() => {
		hydrated = true;
	});

	$effect(() => {
		if (!hydrated) return;
		const query = new URLSearchParams({
			difficulty: mode,
			period,
			page: String(pageNumber),
			device: getDeviceId() ?? ''
		});
		let cancelled = false;
		board = null;
		fetch(`/api/scores?${query}`)
			.then((res) => {
				if (!res.ok) throw new Error(`/api/scores responded ${res.status}`);
				return res.json() as Promise<GlobalBoardPage>;
			})
			.then((result) => {
				if (!cancelled) board = result;
			})
			.catch((err: unknown) => {
				console.error('Could not load the board:', err);
				if (!cancelled) board = 'error';
			});
		return () => {
			cancelled = true;
		};
	});

	/** The board's query string with `changes` applied; a change of mode or period starts at page 1 */
	function query(changes: { mode?: Difficulty; period?: BoardPeriod; page?: number }): string {
		const target = changes.page ?? 1;
		return new URLSearchParams({
			mode: changes.mode ?? mode,
			period: changes.period ?? period,
			...(target > 1 ? { page: String(target) } : {})
		}).toString();
	}

	function show(changes: { mode?: Difficulty; period?: BoardPeriod }) {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- a resolve() result plus a query string
		goto(`${resolve('/leaderboard')}?${query(changes)}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	async function saveName(name: string) {
		setPlayerName(name);
		editingName = false;
		return 'saved' as const;
	}
</script>

<svelte:head>
	<title>{ts('leaderboard.title')} — Geekster</title>
</svelte:head>

{#snippet boardRow(row: GlobalScoreEntry)}
	<li
		class="rounded-thumb flex min-h-11 items-center gap-2.5 px-2.5 py-2 text-sm {row.mine
			? 'border-accent bg-accent-soft border'
			: ''}"
		data-mine={row.mine}
	>
		<span
			class="font-ui tabular w-8 shrink-0 font-bold {row.rank === 1
				? 'text-accent'
				: 'text-ink-muted'}">{row.rank}</span
		>
		<span class="flex min-w-0 flex-1 flex-col">
			<span class="text-ink truncate font-bold">{row.playerName}</span>
			<span class="text-ink-muted text-xs">
				{tf<(n: number) => string>('leaderboard.placedCount')(
					row.correctPlacements ?? 0
				)}{#if row.createdAt}{` · ${formatShortDate(row.createdAt)}`}{/if}
			</span>
		</span>
		<span class="font-ui tabular text-score shrink-0 font-bold tracking-[1px]">
			<span aria-hidden="true">{formatNumber(row.totalScore)} {ts('hud.creditsShort')}</span>
			<span class="sr-only"
				>{tf<(n: string) => string>('hud.credits')(formatNumber(row.totalScore))}</span
			>
		</span>
		{#if row.mine}
			<Chip tone="pink" size="xs">{ts('leaderboard.you')}</Chip>
		{/if}
	</li>
{/snippet}

{#snippet message(text: string)}
	<p
		class="rounded-control border-line-strong text-ink-muted flex min-h-24 items-center justify-center border-[1.5px] border-dashed p-3 text-center text-sm"
	>
		{text}
	</p>
{/snippet}

<div class="mx-auto flex w-full max-w-[720px] flex-col gap-5 px-4 pt-6 pb-12">
	<a
		href={resolve('/')}
		class="font-ui text-accent focus-ring rounded-chip self-start text-sm font-bold"
		>← {ts('legal.back')}</a
	>
	<h1 tabindex="-1" class="font-display text-ink m-0 text-3xl leading-tight outline-none">
		{ts('leaderboard.title')}
	</h1>

	<div class="grid gap-4 sm:grid-cols-2">
		<SegmentedControl
			legend={ts('board.mode')}
			name="board-mode"
			options={[
				{ value: 'normal', label: ts('mode.normal') },
				{ value: 'pro', label: ts('mode.pro'), tone: 'pink' }
			]}
			value={mode}
			onchange={(value) => show({ mode: value })}
		/>
		<SegmentedControl
			legend={ts('board.period')}
			name="board-period"
			options={[
				{ value: 'all', label: ts('board.allTime') },
				{ value: 'week', label: ts('board.week') }
			]}
			value={period}
			onchange={(value) => show({ period: value })}
		/>
	</div>

	<Surface as="section" frame="magenta" padding="none" class="p-2.5">
		<div class="mb-2 flex items-baseline justify-between gap-3 px-1">
			<h2 class="font-ui text-ink m-0 text-sm font-bold tracking-[1.5px] uppercase">
				{mode === 'pro' ? ts('mode.pro') : ts('mode.normal')} ·
				{period === 'week' ? ts('board.week') : ts('board.allTime')}
			</h2>
			{#if board && board !== 'error'}
				<span class="text-ink-muted text-[13px]"
					>{tf<(n: number) => string>('board.players')(board.players)}</span
				>
			{/if}
		</div>
		<p class="text-ink-muted mb-2 px-1 text-xs">
			{period === 'week' ? ts('board.weekHint') : ts('board.allTimeHint')}
		</p>

		{#if board === null}
			<div class="flex flex-col gap-1.5 py-1">
				<span class="sr-only">{ts('leaderboard.loading')}</span>
				{#each [100, 90, 80, 70, 60] as width (width)}
					<div
						class="rounded-thumb h-10 bg-[#0c2a36] motion-safe:animate-pulse"
						style:width="{width}%"
					></div>
				{/each}
			</div>
		{:else if board === 'error'}
			{@render message(ts('leaderboard.globalUnavailable'))}
		{:else if board.rows.length === 0}
			{@render message(
				period === 'week' ? ts('board.emptyWeek') : ts('leaderboard.noGlobalScores')
			)}
		{:else}
			<ol class="flex flex-col gap-0.5" data-board-rows={board.rows.length}>
				{#each board.rows as row (row.id)}
					{@render boardRow(row)}
				{/each}
			</ol>
		{/if}

		{#if board && board !== 'error' && board.me && board.me.page !== board.page}
			<!-- The player's own row lives on another page: shown here, with the way to it -->
			<div class="border-line mt-2 flex flex-col gap-1 border-t pt-2" data-me-page={board.me.page}>
				<ol class="flex flex-col">
					{@render boardRow(board.me)}
				</ol>
				{#if board.me.page <= board.pages}
					<a
						href="{resolve('/leaderboard')}?{query({ page: board.me.page })}"
						class="focus-ring rounded-thumb font-ui text-accent hover:text-ink flex min-h-10 items-center justify-center text-xs font-bold tracking-[1.5px] uppercase"
						data-sveltekit-noscroll
						>{tf<(p: number) => string>('board.goToPage')(board.me.page)} →</a
					>
				{/if}
			</div>
		{/if}

		{#if board && board !== 'error' && board.pages > 1}
			<nav
				class="mt-3 flex items-center justify-between gap-2"
				aria-label={tf<(p: number, n: number) => string>('board.page')(board.page, board.pages)}
			>
				{#if board.page > 1}
					<a
						href="{resolve('/leaderboard')}?{query({ page: board.page - 1 })}"
						class="focus-ring rounded-control border-line-strong text-ink hover:border-accent font-ui flex min-h-11 items-center border-[1.5px] px-4 text-sm font-bold"
						data-sveltekit-noscroll
						rel="prev">← {ts('board.previous')}</a
					>
				{:else}
					<span></span>
				{/if}
				<span class="text-ink-muted text-[13px]"
					>{tf<(p: number, n: number) => string>('board.page')(board.page, board.pages)}</span
				>
				{#if board.page < board.pages}
					<a
						href="{resolve('/leaderboard')}?{query({ page: board.page + 1 })}"
						class="focus-ring rounded-control border-line-strong text-ink hover:border-accent font-ui flex min-h-11 items-center border-[1.5px] px-4 text-sm font-bold"
						data-sveltekit-noscroll
						rel="next">{ts('board.next')} →</a
					>
				{:else}
					<span></span>
				{/if}
			</nav>
		{/if}
	</Surface>

	<!-- The name for the next runs; scores already on the board keep theirs (10c-3) -->
	<Surface as="section" frame="line" padding="md" class="flex flex-col gap-3">
		<h2 class="font-ui text-pink m-0 text-sm font-bold tracking-[2px] uppercase">
			{ts('board.yourName')}
		</h2>
		{#if editingName}
			<PlayerNameForm
				id="board-name"
				initial={playerName ?? ''}
				onsave={saveName}
				cancelLabel={ts('board.cancel')}
				oncancel={() => (editingName = false)}
			/>
		{:else}
			<div class="flex items-center justify-between gap-3">
				<p class="min-w-0 {playerName ? 'text-ink truncate font-bold' : 'text-ink-muted text-sm'}">
					{playerName ?? ts('board.noName')}
				</p>
				<Button
					variant="secondary"
					size="sm"
					class="shrink-0"
					disabled={!hydrated}
					onclick={() => (editingName = true)}>{ts('board.change')}</Button
				>
			</div>
		{/if}
		<p class="text-ink-muted text-[13px]">{ts('board.nameHint')}</p>
	</Surface>
</div>
