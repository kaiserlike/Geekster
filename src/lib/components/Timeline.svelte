<script lang="ts" module>
	// Past this many cards the rows lose their thumbnails and become one 40 px line. With the
	// year-first rows of 9d (~64 px) the thumbnails can stay longer than the 12 of the old
	// screenshot rows: 20 cards are ~2,500 px on a phone, which auto-scroll still crosses
	export const COMPACT_TIMELINE_AT = 20;
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import type { Game } from '$lib/types';
	import type { DragPlace } from '$lib/dragPlace.svelte';
	import { tf, ts } from '$lib/i18n.svelte';
	import { DURATION } from '$lib/motion';
	import { prefersReducedMotion } from 'svelte/motion';
	import { decadeBuckets } from '$lib/placement';
	import DecadeRuler from './DecadeRuler.svelte';
	import TimelineRow from './TimelineRow.svelte';
	import TimelineSlot from './TimelineSlot.svelte';

	interface Props {
		timeline: Game[];
		lastPlacedGameId: number | null;
		/** Slots only while there is a card to place */
		showSlots: boolean;
		/** The bonus guess: the card just placed keeps its name and year hidden */
		bonusGuessing: boolean;
		/** The reveal of the card just placed */
		revealing: boolean;
		/** A wrong placement: whether the card just placed went in wrong */
		misplaced: boolean;
		/** A wrong placement: the slot the player chose, in this timeline (`ghostSlotIndex`) */
		ghostAt: number | null;
		drag: DragPlace;
		onPlace: (slotIndex: number) => void;
	}

	let {
		timeline,
		lastPlacedGameId,
		showSlots,
		bonusGuessing,
		revealing,
		misplaced,
		ghostAt,
		drag,
		onPlace
	}: Props = $props();

	const compactTimeline = $derived(timeline.length > COMPACT_TIMELINE_AT);
	const buckets = $derived(decadeBuckets(timeline));
	const decadeStarts = $derived(new Map(buckets.map((b) => [b.firstIndex, b.decade])));
	let list: HTMLOListElement | undefined = $state(undefined);
	let currentDecade: number | null = $state(null);
	// The ruler is the overview of a long timeline: from RULER_FROM cards, once the page scrolls,
	// and never with one decade (a button that goes nowhere). The big card alone makes the page
	// scroll, so overflowing is not enough
	const RULER_FROM = 8;
	let pageOverflows: boolean = $state(false);
	const showRuler = $derived(timeline.length >= RULER_FROM && buckets.length > 1 && pageOverflows);

	const anchorId = (decade: number) => `decade-${decade}`;

	// The pinned bar (compact HUD and the card's strip) covers the viewport's top once the card
	// has scrolled off: a decade's first row scrolls to just under it (scroll-mt-40)
	const PINNED_HEIGHT = 160;
	// "Next card" is pinned to the bottom during a reveal
	const NEXT_BAR = 76;

	function slotLabel(index: number): string {
		const before = timeline[index - 1];
		const after = timeline[index];
		let where: string;
		if (before && after) {
			where = tf<(a: string, ay: number, b: string, by: number) => string>('slot.between')(
				before.name,
				before.year,
				after.name,
				after.year
			);
		} else if (after) {
			where = tf<(n: string, y: number) => string>('slot.first')(after.name, after.year);
		} else {
			where = tf<(n: string, y: number) => string>('slot.last')(before.name, before.year);
		}
		return `${ts('slot.placeHere')}, ${where}`;
	}

	function rowStatus(game: Game): 'settled' | 'hidden' | 'placed' | 'misplaced' {
		if (game.id !== lastPlacedGameId) return 'settled';
		if (bonusGuessing) return 'hidden';
		if (!revealing) return 'settled';
		return misplaced ? 'misplaced' : 'placed';
	}

	// The decade whose first row has passed under the pinned bar
	function updateCurrentDecade() {
		pageOverflows = document.documentElement.scrollHeight > window.innerHeight;
		if (!showRuler) return;
		let current = buckets[0]?.decade ?? null;
		for (const bucket of buckets) {
			const row = document.getElementById(anchorId(bucket.decade));
			if (row && row.getBoundingClientRect().top <= PINNED_HEIGHT + 1) current = bucket.decade;
		}
		currentDecade = current;
	}

	let scrollFrame = 0;
	function onScroll() {
		cancelAnimationFrame(scrollFrame);
		scrollFrame = requestAnimationFrame(updateCurrentDecade);
	}
	$effect(() => {
		void timeline.length;
		void showRuler;
		tick().then(updateCurrentDecade);
		return () => cancelAnimationFrame(scrollFrame);
	});

	function jumpTo(decade: number) {
		const row = document.getElementById(anchorId(decade));
		if (row) drag.scrollTo(row);
	}

	/**
	 * The one scroll a reveal is allowed (9a: never towards an answer): the card just placed,
	 * and on a miss its ghost too when both fit; otherwise the scroll follows the card to where
	 * it belongs, which is the thing to learn. Nothing moves when they are already in view.
	 */
	export function revealInView(): void {
		if (!list) return;
		const placed = list.querySelector<HTMLElement>('[data-placed]');
		if (!placed) return;
		const ghostEl = list.querySelector<HTMLElement>('[data-ghost]');
		const viewTop = 0;
		const viewBottom = window.innerHeight - NEXT_BAR;
		let { top, bottom } = placed.getBoundingClientRect();
		if (ghostEl) {
			const g = ghostEl.getBoundingClientRect();
			if (Math.max(bottom, g.bottom) - Math.min(top, g.top) <= viewBottom - viewTop) {
				top = Math.min(top, g.top);
				bottom = Math.max(bottom, g.bottom);
			}
		}
		if (top >= viewTop && bottom <= viewBottom) return;
		const offset = Math.max(0, (viewBottom - viewTop - (bottom - top)) / 2);
		window.scrollBy({
			top: top - viewTop - offset,
			behavior: prefersReducedMotion.current ? 'instant' : 'smooth'
		});
	}

	/**
	 * A miss: the card starts at the ghost, where the player put it, and slides to where it
	 * belongs (U8). Reduced motion: it is simply there, next to its ghost.
	 */
	function slideFromGhost(node: HTMLElement) {
		if (prefersReducedMotion.current) return;
		const ghost = node.parentElement?.querySelector<HTMLElement>('[data-ghost]');
		if (!ghost) return;
		const row = node.firstElementChild;
		if (!row) return;
		// The row moves, not the list item: the reveal's scroll measures the item where it stays
		const dy = ghost.getBoundingClientRect().top - node.getBoundingClientRect().top;
		const animation = row.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], {
			duration: DURATION.reveal,
			delay: DURATION.slow,
			easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
			fill: 'backwards'
		});
		return () => animation.cancel();
	}
</script>

{#snippet ghost()}
	<li
		data-ghost
		class="rounded-control border-danger font-ui text-danger flex h-11 items-center justify-center gap-2 border-2 border-dashed bg-[#1a0a12] text-[13px] font-bold tracking-[1.5px] uppercase"
	>
		<span aria-hidden="true">✗</span>
		{ts('timeline.youPutItHere')}
	</li>
{/snippet}

{#snippet slot(index: number)}
	<li>
		<TimelineSlot
			onPlace={() => onPlace(index)}
			slotIndex={index}
			label={slotLabel(index)}
			highlighted={drag.highlightedSlotIndex === index}
			expanded={drag.isDragging}
			compact={compactTimeline}
		/>
	</li>
{/snippet}

<svelte:window
	onscroll={onScroll}
	onresize={onScroll}
	ondragover={drag.windowDragOver}
	ondragleave={drag.windowDragLeave}
/>

<section aria-labelledby="timeline-heading">
	<div class="flex h-9 items-baseline justify-between gap-3">
		<!-- What "PLACED" in the HUD used to count: the cards the timeline already holds -->
		<h2 id="timeline-heading" class="font-ui text-pink text-xs font-bold tracking-[2px] uppercase">
			{ts('timeline.heading')} · <span class="tabular">{timeline.length}</span>
		</h2>
		<span class="text-ink-muted text-[13px]">{ts('timeline.oldestFirst')}</span>
	</div>

	<ol bind:this={list} class="flex flex-col pb-2 {compactTimeline ? 'gap-1.5' : 'gap-2'}">
		{#if showSlots}
			{@render slot(0)}
		{/if}
		{#if ghostAt === 0}
			{@render ghost()}
		{/if}

		{#each timeline as game, i (game.id)}
			{@const decade = decadeStarts.get(i)}
			{@const status = rowStatus(game)}
			{#if decade !== undefined}
				<li class="font-ui text-pink flex h-7 items-end text-[13px] font-bold tracking-[3px]">
					{tf<(d: number) => string>('timeline.decade')(decade)}
				</li>
			{/if}
			<li
				id={decade !== undefined ? anchorId(decade) : undefined}
				class="relative scroll-mt-40 {status === 'misplaced' ? 'z-[15]' : ''}"
				data-placed={status === 'placed' || status === 'misplaced' ? '' : undefined}
				{@attach status === 'misplaced' ? slideFromGhost : undefined}
			>
				<TimelineRow {game} {status} compact={compactTimeline && game.id !== lastPlacedGameId} />
			</li>
			{#if showSlots}
				{@render slot(i + 1)}
			{/if}
			{#if ghostAt === i + 1}
				{@render ghost()}
			{/if}
		{/each}
	</ol>

	{#if showRuler}
		<!-- Beside the column, where a wide screen has room for it; a phone has none (see SPRINTS) -->
		<div class="fixed top-40 bottom-6 left-[calc(50%+464px)] z-30 hidden w-18 flex-col xl:flex">
			<DecadeRuler {buckets} current={currentDecade} {anchorId} onJump={jumpTo} />
		</div>
	{/if}
</section>

{#if drag.scrollEdge}
	<!-- The auto-scroll cue: a turquoise edge on the side of the viewport that is scrolling -->
	<div
		aria-hidden="true"
		class="pointer-events-none fixed inset-x-0 z-[60] flex h-16 justify-center {drag.scrollEdge ===
		'top'
			? 'border-accent top-0 items-start border-t-2 bg-linear-to-b from-[rgb(63_240_228/0.22)] pt-1.5'
			: 'border-accent bottom-0 items-end border-b-2 bg-linear-to-t from-[rgb(63_240_228/0.22)] pb-1.5'}"
	>
		<span
			class="rounded-chip bg-accent font-ui text-on-accent px-2 text-xs font-bold tracking-[1.5px] uppercase"
		>
			{drag.scrollEdge === 'top' ? '▲' : '▼'}
			{ts('timeline.scrolling')}
		</span>
	</div>
{/if}
