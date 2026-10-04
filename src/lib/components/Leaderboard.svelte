<script lang="ts">
	import type {
		ClassicLeaderboardEntry,
		Difficulty,
		GlobalBoardPage,
		GlobalScoreEntry,
		LeaderboardEntry
	} from '$lib/types';
	import { resolve } from '$app/paths';
	import { getDeviceId } from '$lib/player.svelte';
	import { getClassicLeaderboard } from '$lib/leaderboard';
	import { formatNumber, formatShortDate, tf, ts } from '$lib/i18n.svelte';
	import Chip from './ui/Chip.svelte';
	import Surface from './ui/Surface.svelte';

	type Tab = 'local' | 'global' | 'classic';

	interface Props {
		/** This device's runs in `mode`, best first */
		entries: LeaderboardEntry[];
		/** Which mode's lists these are: the global tab fetches the same one */
		mode: Difficulty;
		/** The run just finished, marked NEW; -1 for none */
		highlightIndex?: number;
		/** Rows per tab. The run just finished is always shown, whatever its rank */
		limit?: number;
		/** Unique per page: the tabs' ids hang off it */
		id?: string;
	}

	let { entries, mode, highlightIndex = -1, limit = 10, id = 'leaderboard' }: Props = $props();

	const localRows = $derived(entries.slice(0, Math.max(limit, highlightIndex + 1)));

	// The old 10-game list is only offered when this browser still has one, and only next to
	// Normal: every classic run was one
	const classicEntries: ClassicLeaderboardEntry[] = $derived(
		mode === 'normal' ? getClassicLeaderboard().slice(0, limit) : []
	);

	const tabs: { value: Tab; label: string }[] = $derived([
		{ value: 'local', label: ts('leaderboard.local') },
		{ value: 'global', label: ts('leaderboard.global') },
		...(classicEntries.length > 0
			? [{ value: 'classic' as const, label: ts('leaderboard.classic') }]
			: [])
	]);

	// Typed through the cast: a literal initial value would narrow the variable to 'local'
	let activeTab: Tab = $state('local' as Tab);
	// The classic tab disappears when the mode switches to Pro
	const shownTab: Tab = $derived(tabs.some((t) => t.value === activeTab) ? activeTab : 'local');

	// One request per mode and page: switching back and forth doesn't fetch again
	let globalByMode: Partial<Record<Difficulty, GlobalScoreEntry[] | 'error'>> = $state({});
	const globalScores = $derived(globalByMode[mode]);

	$effect(() => {
		if (shownTab === 'global' && globalByMode[mode] === undefined) loadGlobal(mode);
	});

	async function loadGlobal(forMode: Difficulty) {
		try {
			// The board's first page, each player's best; this device's rows come back marked
			const query = new URLSearchParams({ difficulty: forMode, device: getDeviceId() ?? '' });
			const res = await fetch(`/api/scores?${query}`);
			if (!res.ok) throw new Error(`/api/scores responded ${res.status}`);
			const board: GlobalBoardPage = await res.json();
			globalByMode[forMode] = board.rows.slice(0, limit);
		} catch {
			globalByMode[forMode] = 'error';
		}
	}

	let tabButtons: HTMLButtonElement[] = $state([]);

	// Arrow keys, Home and End move between the tabs (the ARIA tabs pattern, automatic activation)
	function onTabKey(event: KeyboardEvent, index: number) {
		const last = tabs.length - 1;
		const next =
			event.key === 'ArrowRight'
				? index === last
					? 0
					: index + 1
				: event.key === 'ArrowLeft'
					? index === 0
						? last
						: index - 1
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? last
							: null;
		if (next === null) return;
		event.preventDefault();
		activeTab = tabs[next].value;
		tabButtons[next]?.focus();
	}

	function placed(n: number | null): string {
		return tf<(n: number) => string>('leaderboard.placedCount')(n ?? 0);
	}
</script>

{#snippet row(
	rank: number,
	score: number,
	meta: string,
	options: { isNew?: boolean; badge?: string; name?: string; mine?: boolean } = {}
)}
	<li
		class="rounded-thumb flex min-h-10 items-center gap-2.5 px-2.5 py-2 text-sm {options.isNew ||
		options.mine
			? 'border-accent bg-accent-soft border'
			: ''}"
	>
		<span
			class="font-ui tabular w-6 shrink-0 font-bold {rank === 1 ? 'text-accent' : 'text-ink-muted'}"
			>{rank}</span
		>
		{#if options.name !== undefined}
			<span class="text-ink min-w-0 flex-1 truncate font-bold">{options.name}</span>
		{/if}
		<span
			class="font-ui tabular text-score font-bold tracking-[1px] {options.name === undefined
				? 'flex-1'
				: 'shrink-0'}"
		>
			<span aria-hidden="true">{formatNumber(score)} {ts('hud.creditsShort')}</span>
			<span class="sr-only">{tf<(n: string) => string>('hud.credits')(formatNumber(score))}</span>
		</span>
		{#if meta}
			<span class="text-right {options.isNew ? 'text-ink' : 'text-ink-muted'}">{meta}</span>
		{/if}
		{#if options.mine}
			<Chip tone="pink" size="xs">{ts('leaderboard.you')}</Chip>
		{/if}
		{#if options.badge}
			<Chip tone="accent" size="xs">{options.badge}</Chip>
		{/if}
		{#if options.isNew}
			<Chip tone="pink" size="xs">{ts('leaderboard.new')}</Chip>
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

<Surface as="section" frame="magenta" padding="none" class="p-2.5">
	<h2 class="sr-only">{ts('leaderboard.title')}</h2>
	<div
		role="tablist"
		aria-label={ts('leaderboard.title')}
		class="mb-2 grid gap-1"
		style:grid-template-columns="repeat({tabs.length}, minmax(0, 1fr))"
	>
		{#each tabs as tab, i (tab.value)}
			{@const selected = tab.value === shownTab}
			<button
				bind:this={tabButtons[i]}
				type="button"
				role="tab"
				id="{id}-tab-{tab.value}"
				aria-selected={selected}
				aria-controls="{id}-panel"
				tabindex={selected ? 0 : -1}
				onclick={() => (activeTab = tab.value)}
				onkeydown={(e) => onTabKey(e, i)}
				class="focus-ring rounded-thumb font-ui h-10 text-xs font-bold tracking-[1.5px] uppercase transition-colors duration-(--duration-fast) {selected
					? 'bg-accent-soft text-focus shadow-[inset_0_-2px_0_var(--color-accent)]'
					: 'text-ink-muted hover:text-ink hover:bg-surface-raised'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<div id="{id}-panel" role="tabpanel" aria-labelledby="{id}-tab-{shownTab}" data-tab={shownTab}>
		{#if shownTab === 'local'}
			{#if localRows.length === 0}
				{@render message(ts('leaderboard.empty'))}
			{:else}
				<ol class="flex flex-col gap-0.5">
					{#each localRows as entry, i (entry.date)}
						{@render row(
							i + 1,
							entry.score,
							i === highlightIndex
								? placed(entry.correctPlacements)
								: `${placed(entry.correctPlacements)} · ${formatShortDate(entry.date)}`,
							{
								isNew: i === highlightIndex,
								badge:
									entry.endReason === 'poolCleared'
										? entry.wrongPlacements === 0
											? ts('leaderboard.perfect')
											: ts('leaderboard.cleared')
										: undefined
							}
						)}
					{/each}
				</ol>
			{/if}
		{:else if shownTab === 'classic'}
			<p class="text-ink-muted mb-2 px-1 text-xs">{ts('leaderboard.classicHint')}</p>
			<ol class="flex flex-col gap-0.5">
				{#each classicEntries as entry, i (entry.date)}
					{@render row(
						i + 1,
						entry.score,
						`${entry.isWin ? ts('leaderboard.win') : ts('leaderboard.loss')} · ${entry.correctPlacements}/${entry.correctPlacements + entry.wrongPlacements} · ${formatShortDate(entry.date)}`
					)}
				{/each}
			</ol>
		{:else if globalScores === undefined}
			<div class="flex flex-col gap-1.5 py-1" aria-busy="true">
				<span class="sr-only">{ts('leaderboard.loading')}</span>
				{#each [100, 85, 70] as width (width)}
					<div
						class="rounded-thumb h-9 bg-[#0c2a36] motion-safe:animate-pulse"
						style:width="{width}%"
					></div>
				{/each}
			</div>
		{:else if globalScores === 'error'}
			{@render message(ts('leaderboard.globalUnavailable'))}
		{:else if globalScores.length === 0}
			{@render message(ts('leaderboard.noGlobalScores'))}
		{:else}
			<ol class="flex flex-col gap-0.5">
				{#each globalScores as score (score.id)}
					{@render row(score.rank, score.totalScore, '', {
						name: score.playerName,
						mine: score.mine
					})}
				{/each}
			</ol>
		{/if}
	</div>
	<!-- On every tab: the welcome and result screens' way to the whole global board (10c) -->
	<a
		href="{resolve('/leaderboard')}?mode={mode}"
		class="focus-ring rounded-thumb font-ui text-accent hover:text-ink mt-2 flex min-h-10 items-center justify-center text-xs font-bold tracking-[1.5px] uppercase"
	>
		{ts('leaderboard.seeAll')} →
	</a>
</Surface>
