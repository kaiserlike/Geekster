<script lang="ts">
	import type { DecadeBucket } from '$lib/placement';
	import { tf, ts } from '$lib/i18n.svelte';

	interface Props {
		buckets: DecadeBucket[];
		/** The decade in view at the top, under the pinned bar */
		current: number | null;
		/**
		 * Each decade's height in the timeline, in px: the buttons take the same share of the
		 * ruler, so it is the timeline in miniature. Until measured, the card count
		 */
		heights?: Map<number, number>;
		/** The id of each decade's first row, which the pane scrolls to */
		anchorId: (decade: number) => string;
		onJump: (decade: number) => void;
	}

	let { buckets, current, anchorId, heights, onJump }: Props = $props();
</script>

<!--
	Beside the column on a wide screen: one button per decade the timeline holds, as tall as its
	share of the timeline and never under 44 px. A click scrolls there; while dragging, hovering one
	does (HTML5 here, touch in DragPlace through `data-scroll-to`)
-->
<nav aria-label={ts('timeline.ruler')} class="flex min-h-0 flex-1 flex-col gap-1 pt-0.5">
	{#each buckets as bucket (bucket.decade)}
		{@const isCurrent = bucket.decade === current}
		<button
			type="button"
			onclick={() => onJump(bucket.decade)}
			ondragenter={() => onJump(bucket.decade)}
			ondragover={(e) => e.preventDefault()}
			data-scroll-to={anchorId(bucket.decade)}
			aria-label={tf<(d: number, n: number) => string>('timeline.rulerDecade')(
				bucket.decade,
				bucket.count
			)}
			aria-current={isCurrent ? 'location' : undefined}
			style="flex: {heights?.get(bucket.decade) ?? bucket.count} 1 0"
			class="focus-ring rounded-thumb font-ui flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs font-bold transition-colors duration-(--duration-fast) {isCurrent
				? 'bg-accent-soft text-ink shadow-[inset_0_0_0_2px_var(--color-accent),0_0_12px_rgb(63_240_228/0.4)]'
				: 'bg-surface-raised text-ink-muted hover:bg-accent-soft hover:text-ink hover:shadow-[inset_0_0_0_1.5px_var(--color-line-strong)]'}"
		>
			<span aria-hidden="true"
				>{tf<(d: number) => string>('timeline.decadeShort')(bucket.decade)}</span
			>
			<span aria-hidden="true" class="tabular text-[11px]">{bucket.count}</span>
		</button>
	{/each}
</nav>
