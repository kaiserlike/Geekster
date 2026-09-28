<script lang="ts">
	import type { Game } from '$lib/types';
	import { ts } from '$lib/i18n.svelte';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import Chip from './ui/Chip.svelte';

	interface Props {
		game: Game;
		/**
		 * hidden = just placed, while its name and year are the bonus question; placed = just
		 * placed and revealed; misplaced = a wrong placement, shown where it belongs; missed = one of
		 * the run's misses on the result screen, marked ✗
		 */
		status?: 'settled' | 'hidden' | 'placed' | 'misplaced' | 'missed';
		/** One 40 px line (year and name), past `COMPACT_TIMELINE_AT` */
		compact?: boolean;
	}

	let { game, status = 'settled', compact = false }: Props = $props();

	const FRAMES = {
		settled: 'border border-line bg-surface-raised',
		hidden: 'border-2 border-accent bg-surface-raised shadow-glow-card',
		placed: 'border-2 border-accent bg-surface-raised shadow-glow-accent',
		misplaced: 'border-2 border-danger bg-danger-soft shadow-glow-danger',
		missed: 'border-[1.5px] border-danger bg-danger-soft'
	} as const;
	const red = $derived(status === 'misplaced' || status === 'missed');
</script>

<!-- Year first (U10): the year is what a placement decision needs, the screenshot only a reminder -->
<div
	class="flex items-center {FRAMES[status]} {compact
		? 'rounded-control h-10 gap-3.5 px-3.5'
		: 'rounded-card gap-3 py-1.5 pr-1.5 pl-3.5 lg:gap-4 lg:pl-4.5'}"
	data-status={status}
>
	{#if status === 'hidden'}
		<span class="shrink-0 {compact ? 'min-w-13' : 'min-w-[58px] lg:min-w-[70px]'}">
			<Chip tone="mystery" size="sm">????</Chip>
		</span>
		<span class="text-ink-muted min-w-0 flex-1 text-[15px] italic">{ts('timeline.justPlaced')}</span
		>
	{:else}
		<span
			class="font-ui tabular shrink-0 font-bold {red
				? 'text-danger'
				: 'text-accent-strong'} {compact
				? 'w-13 text-lg'
				: 'w-[58px] text-[22px] lg:w-[70px] lg:text-[26px]'}"
		>
			{game.year}
		</span>
		<span class="flex min-w-0 flex-1 flex-col">
			<span
				class="font-medium {compact
					? 'truncate text-[15px]'
					: 'line-clamp-2 text-[15px] leading-snug lg:text-[17px]'}"
			>
				{game.name}
			</span>
			{#if status === 'misplaced'}
				<span class="text-danger text-xs">{ts('timeline.belongsHere')}</span>
			{/if}
		</span>
		{#if status === 'missed'}
			<span class="text-danger shrink-0 pr-1 font-bold">
				<span aria-hidden="true">✗</span>
				<span class="sr-only">{ts('result.missed')}</span>
			</span>
		{/if}
	{/if}
	{#if !compact}
		<img
			src={resolveScreenshotUrl(game.screenshot)}
			alt=""
			loading="lazy"
			class="rounded-thumb h-13 w-23 shrink-0 object-cover lg:h-18 lg:w-32"
		/>
	{/if}
</div>
