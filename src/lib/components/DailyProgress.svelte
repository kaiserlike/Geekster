<script lang="ts">
	import { DAILY_CARDS, dailyProgress } from '$lib/daily';
	import { formatMultiplier, tf, ts } from '$lib/i18n.svelte';
	import { getStreakMultiplier } from '$lib/scoring';
	import Chip from './ui/Chip.svelte';
	import Flame from './ui/icons/Flame.svelte';

	interface Props {
		/** `o` right, `x` missed, one per card placed so far */
		marks: string;
		/** A card is up to be placed: its square glows */
		cardUp: boolean;
		streak: number;
		/** Squares and chip only, for the one-line HUD while dragging */
		compact?: boolean;
	}

	let { marks, cardUp, streak, compact = false }: Props = $props();

	const progress = $derived(dailyProgress(marks, cardUp));
	const hits = $derived(progress.cells.filter((c) => c === 'hit').length);
	const misses = $derived(progress.cells.filter((c) => c === 'miss').length);
	// The multiplier the next correct card earns, as the endless HUD's chip
	const multiplier = $derived(getStreakMultiplier(streak + 1));
	const chipTone = $derived(multiplier > 1 ? 'multiplier' : 'neutral');

	const CELL = {
		hit: 'bg-accent border-accent',
		miss: 'bg-danger border-danger',
		current: 'border-pink bg-surface-sunken shadow-[0_0_8px_rgb(255_122_230/0.6)]',
		open: 'border-line bg-surface-sunken'
	} as const;
</script>

{#snippet squares(grid: string, cellSize: string)}
	<!-- Each square has a capped width: stretched to a wide HUD they read as a bar again -->
	<div
		class="grid flex-1 {grid}"
		role="img"
		aria-label="{tf<(n: number, of: number) => string>('hud.cardSpoken')(
			progress.card,
			DAILY_CARDS
		)}, {tf<(hits: number, misses: number) => string>('daily.marks')(hits, misses)}"
		data-daily-progress={marks}
	>
		{#each progress.cells as cell, i (i)}
			<span
				class="rounded-chip {cellSize} border-[1.5px] transition-[background-color,border-color] duration-(--duration-fast) motion-reduce:transition-none {CELL[
					cell
				]}"
			></span>
		{/each}
	</div>
{/snippet}

{#snippet chip()}
	<Chip tone={chipTone} size="md">{formatMultiplier(multiplier)}</Chip>
{/snippet}

{#if compact}
	<div class="flex min-w-0 flex-1 items-center gap-3">
		{@render squares('grid-cols-[repeat(10,minmax(0,12px))] gap-[3px]', 'h-3')}
		{@render chip()}
	</div>
{:else}
	<div class="flex flex-col gap-2.5">
		<div class="flex items-center justify-between">
			<p
				class="font-ui tabular text-ink m-0 text-[15px] font-bold tracking-[1.5px] uppercase"
				aria-hidden="true"
			>
				{ts('hud.card')}
				<span class="text-pink">{progress.card}</span>
				<span class="text-ink-subtle">/ {DAILY_CARDS}</span>
			</p>
			<div class="flex items-center gap-2">
				<span
					class="font-ui tabular inline-flex items-center gap-1.5 text-base font-bold {streak > 0
						? 'text-score'
						: 'text-ink-subtle'}"
					data-run-streak={streak}
				>
					<Flame size={14} />
					<span aria-hidden="true">{streak}</span>
					<span class="sr-only">{tf<(n: number) => string>('hud.streakCount')(streak)}</span>
				</span>
				{@render chip()}
			</div>
		</div>
		{@render squares('grid-cols-[repeat(10,minmax(0,30px))] gap-[5px]', 'h-4')}
	</div>
{/if}
