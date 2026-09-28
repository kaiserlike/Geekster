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
	// The ruler is the overview of a long timeline: only once the pane has more than fits, and
	// never with one decade (a button that goes nowhere)
	let paneOverflows: boolean = $state(false);
	const showRuler = $derived(buckets.length > 1 && paneOverflows);

	let pane: HTMLDivElement | undefined = $state(undefined);
	let list: HTMLOListElement | undefined = $state(undefined);
	let currentDecade: number | null = $state(null);

	$effect(() => {
		drag.setPane(pane ?? null);
		return () => drag.setPane(null);
	});

	const anchorId = (decade: number) => `decade-${decade}`;

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

	// The decade whose first row has passed under the pane's pinned heading. Desktop only: on a
	// phone the page scrolls and the ruler is not shown
	function updateCurrentDecade() {
		if (!pane) return;
		paneOverflows = pane.scrollHeight > pane.clientHeight;
		if (!showRuler) return;
		const top = pane.getBoundingClientRect().top + PINNED_HEIGHT;
		let current = buckets[0]?.decade ?? null;
		for (const bucket of buckets) {
			const row = document.getElementById(anchorId(bucket.decade));
			if (row && row.getBoundingClientRect().top <= top + 1) current = bucket.decade;
		}
		currentDecade = current;
	}
	// The pinned heading (36 px) and a decade label (28 px + the 8 px gap): scroll-mt-[72px]
	const PINNED_HEIGHT = 72;
	// A phone pins "Next card" to the bottom during a reveal
	const NEXT_BAR = 76;

	let scrollFrame = 0;
	function onPaneScroll() {
		cancelAnimationFrame(scrollFrame);
		scrollFrame = requestAnimationFrame(updateCurrentDecade);
	}
	$effect(() => {
		void timeline.length;
		void showRuler;
		tick().then(updateCurrentDecade);
		return () => cancelAnimationFrame(scrollFrame);
	});
	// The pane's height changes with the window
	$effect(() => {
		if (!pane) return;
		const observer = new ResizeObserver(onPaneScroll);
		observer.observe(pane);
		return () => observer.disconnect();
	});

	function jumpTo(decade: number) {
		const row = document.getElementById(anchorId(decade));
		if (row) drag.scrollTo(row);
	}

	/**
	 * The one scroll a reveal is allowed (9a: the pane never scrolls towards an answer): the card
	 * just placed, and on a miss its ghost too, centred in the pane, or in the page on a phone.
	 */
	export function revealInView(): void {
		if (!list) return;
		const placed = list.querySelector<HTMLElement>('[data-placed]');
		if (!placed) return;
		const ghostEl = list.querySelector<HTMLElement>('[data-ghost]');
		const paneScrolls = pane && getComputedStyle(pane).overflowY === 'auto';
		const viewTop = paneScrolls && pane ? pane.getBoundingClientRect().top + PINNED_HEIGHT : 0;
		const viewBottom =
			paneScrolls && pane ? pane.getBoundingClientRect().bottom : window.innerHeight - NEXT_BAR;
		let { top, bottom } = placed.getBoundingClientRect();
		// A miss shows its ghost too, when both fit; otherwise the scroll follows the card to where
		// it belongs, which is the thing to learn
		if (ghostEl) {
			const g = ghostEl.getBoundingClientRect();
			if (Math.max(bottom, g.bottom) - Math.min(top, g.top) <= viewBottom - viewTop) {
				top = Math.min(top, g.top);
				bottom = Math.max(bottom, g.bottom);
			}
		}
		const behavior = prefersReducedMotion.current ? 'instant' : 'smooth';
		// Already in view: nothing moves
		if (top >= viewTop && bottom <= viewBottom) return;
		const offset = Math.max(0, (viewBottom - viewTop - (bottom - top)) / 2);
		const by = top - viewTop - offset;
		if (paneScrolls && pane) pane.scrollBy({ top: by, behavior });
		else window.scrollBy({ top: by, behavior });
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

<section
	aria-labelledby="timeline-heading"
	class="lg:grid lg:h-full lg:min-h-0 {showRuler
		? 'lg:grid-cols-[minmax(0,1fr)_72px] lg:gap-3.5'
		: 'lg:grid-cols-1'}"
>
	<div class="relative lg:min-h-0">
		<!-- From 1024 px the timeline is its own scroll pane: the page itself never scrolls. Its drag
		     handlers only auto-scroll; the slots inside are the drop targets -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={pane}
			onscroll={onPaneScroll}
			ondragover={drag.paneDragOver}
			ondragleave={drag.paneDragLeave}
			class="lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
		>
			<div class="bg-bg flex h-9 items-baseline justify-between gap-3 lg:sticky lg:top-0 lg:z-20">
				<!-- What "PLACED" in the HUD used to count: the cards the timeline already holds -->
				<h2
					id="timeline-heading"
					class="font-ui text-pink text-xs font-bold tracking-[2px] uppercase"
				>
					{ts('timeline.heading')} · <span class="tabular">{timeline.length}</span>
				</h2>
				<span class="text-ink-muted text-[13px]">{ts('timeline.oldestFirst')}</span>
			</div>

			<ol
				bind:this={list}
				class="flex flex-col pb-2 {compactTimeline ? 'gap-1.5 lg:gap-1' : 'gap-2'}"
			>
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
						<!-- Pinned under the heading while its decade is in view (desktop) -->
						<li
							class="font-ui text-pink bg-bg flex h-7 items-end text-[13px] font-bold tracking-[3px] lg:sticky lg:top-9 lg:z-10"
						>
							{tf<(d: number) => string>('timeline.decade')(decade)}
						</li>
					{/if}
					<li
						id={decade !== undefined ? anchorId(decade) : undefined}
						class="relative lg:scroll-mt-[72px] {status === 'misplaced' ? 'z-[15]' : ''}"
						data-placed={status === 'placed' || status === 'misplaced' ? '' : undefined}
						{@attach status === 'misplaced' ? slideFromGhost : undefined}
					>
						<TimelineRow
							{game}
							{status}
							compact={compactTimeline && game.id !== lastPlacedGameId}
						/>
					</li>
					{#if showSlots}
						{@render slot(i + 1)}
					{/if}
					{#if ghostAt === i + 1}
						{@render ghost()}
					{/if}
				{/each}
			</ol>
		</div>

		{#if drag.paneEdge}
			<!-- The auto-scroll cue: a turquoise edge on the side that is scrolling -->
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-x-0 z-30 flex h-16 justify-center {drag.paneEdge ===
				'top'
					? 'border-accent top-9 items-start border-t-2 bg-linear-to-b from-[rgb(63_240_228/0.22)] pt-1.5'
					: 'border-accent bottom-0 items-end border-b-2 bg-linear-to-t from-[rgb(63_240_228/0.22)] pb-1.5'}"
			>
				<span
					class="rounded-chip bg-accent font-ui text-on-accent px-2 text-xs font-bold tracking-[1.5px] uppercase"
				>
					{drag.paneEdge === 'top' ? '▲' : '▼'}
					{ts('timeline.scrolling')}
				</span>
			</div>
		{/if}
	</div>

	{#if showRuler}
		<div class="hidden lg:flex lg:min-h-0 lg:flex-col">
			<DecadeRuler {buckets} current={currentDecade} {anchorId} onJump={jumpTo} />
		</div>
	{/if}
</section>
