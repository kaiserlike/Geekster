<script lang="ts">
	import type { Game } from '$lib/types';
	import type { DragPlace } from '$lib/dragPlace.svelte';
	import { tf, ts } from '$lib/i18n.svelte';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import { fly } from '$lib/motion';
	import Chip from './ui/Chip.svelte';

	interface Props {
		/** The game to place; its year and name stay hidden */
		game: Game;
		/** Its number in the run: the anchor is card 1 */
		cardNumber: number;
		drag: DragPlace;
	}

	let { game, cardNumber, drag }: Props = $props();

	let cardRef: HTMLDivElement | undefined = $state(undefined);
	let block: HTMLDivElement | undefined = $state(undefined);
	// The card has scrolled off the top of a phone: a strip stands in for it (U9)
	let scrolledPast: boolean = $state(false);
	// A touch on the pinned strip keeps it mounted until the finger lifts: a touch whose target
	// leaves the DOM stops reaching the window's touchmove listener
	let stripHeld: boolean = $state(false);

	$effect(() => {
		if (!block) return;
		const observer = new IntersectionObserver(([entry]) => {
			scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
		});
		observer.observe(block);
		return () => observer.disconnect();
	});

	// On a phone the card shrinks to a strip while dragging, so more of the timeline shows. Not
	// once it has scrolled off: shrinking above the viewport would move the slots under the finger
	const stripInFlow = $derived(drag.isDragging && !scrolledPast && !stripHeld);
	const src = $derived(resolveScreenshotUrl(game.screenshot));
</script>

{#snippet strip(dragging: boolean)}
	<div
		class="rounded-card border-accent bg-surface flex items-center gap-3 border-[1.5px] p-1.5 shadow-[0_0_12px_rgb(255_43_214/0.35)]"
	>
		<img
			{src}
			alt=""
			class="rounded-thumb h-13.5 w-24 shrink-0 object-cover {dragging ? 'opacity-50' : ''}"
		/>
		<div class="flex min-w-0 flex-col gap-0.5">
			<span class="font-ui text-accent-strong text-[13px] font-bold tracking-[1.5px] uppercase">
				{dragging ? ts('card.dragging') : `> ${ts('card.incoming')}`}
			</span>
			<span class="text-ink-muted text-[13px]">
				{dragging ? ts('card.draggingHint') : ts('card.hintTouch')}
			</span>
		</div>
	</div>
{/snippet}

<!-- Drag source: the whole block. Hidden parts stay in the DOM, so a touch drag keeps its target -->
<div
	bind:this={block}
	in:fly={{ y: -60, duration: 400 }}
	draggable="true"
	ondragstart={(e) => drag.dragStart(e, cardRef)}
	ondragend={drag.dragEnd}
	ontouchstart={drag.touchStart}
	oncontextmenu={(e) => e.preventDefault()}
	role="application"
	aria-label={ts('card.dragLabel')}
	class="flex cursor-grab flex-col gap-2 select-none active:cursor-grabbing"
	style="-webkit-touch-callout: none; -webkit-user-select: none; touch-action: pan-y;"
>
	<div
		class="font-ui flex justify-between text-xs font-bold tracking-[2px] uppercase {stripInFlow
			? 'max-lg:hidden'
			: ''}"
	>
		<span class="text-accent-strong">
			{drag.isDragging ? ts('card.dragging') : `> ${ts('card.incoming')}`}
		</span>
		<span class="text-ink-muted tabular">
			{tf<(n: number) => string>('card.number')(cardNumber)}
		</span>
	</div>

	<div
		bind:this={cardRef}
		class="rounded-card relative overflow-hidden border-2 transition-[opacity,border-color] duration-(--duration-fast) {drag.isDragging
			? 'border-line-strong bg-surface-sunken border-dashed'
			: 'border-accent shadow-glow-card'} {stripInFlow ? 'max-lg:hidden' : ''}"
	>
		<img
			{src}
			alt={ts('card.alt')}
			class="block aspect-video w-full object-cover {drag.isDragging ? 'opacity-30' : ''}"
			draggable="false"
		/>
		<Chip tone="mystery" size="md" class="absolute top-2 left-2 lg:top-2.5 lg:left-2.5">????</Chip>
	</div>

	<div class={stripInFlow ? 'lg:hidden' : 'hidden'}>
		{@render strip(true)}
	</div>

	<p class="text-ink-muted text-[13px] lg:text-sm {stripInFlow ? 'max-lg:hidden' : ''}">
		<span class="pointer-fine:hidden {drag.isDragging ? 'lg:hidden' : ''}"
			>{ts('card.hintTouch')}</span
		>
		{#if drag.isDragging}
			<span class="max-lg:hidden">{ts('card.draggingHintPane')}</span>
		{/if}
		<span class="pointer-coarse:hidden {drag.isDragging ? 'lg:hidden' : ''}">
			{ts('card.hintPointer')}
			{ts('card.keys')}
			<kbd class="font-ui rounded-chip border-line-strong text-ink border px-1.5 text-xs font-bold"
				>Tab</kbd
			>
			{ts('card.keysToSlot')}
			<kbd class="font-ui rounded-chip border-line-strong text-ink border px-1.5 text-xs font-bold"
				>Enter</kbd
			>
			{ts('card.keysToPlace')}
		</span>
	</p>
</div>

<svelte:window ontouchend={() => (stripHeld = false)} ontouchcancel={() => (stripHeld = false)} />

<!-- The card scrolled off a phone's top: a strip pinned there, and it can be dragged too -->
{#if scrolledPast || stripHeld}
	<div
		class="fixed inset-x-0 top-0 z-40 px-4 pt-2 lg:hidden"
		transition:fly={{ y: -24, duration: 200 }}
		draggable="true"
		ondragstart={(e) => drag.dragStart(e, cardRef)}
		ondragend={drag.dragEnd}
		ontouchstart={(e) => {
			stripHeld = true;
			drag.touchStart(e);
		}}
		oncontextmenu={(e) => e.preventDefault()}
		role="application"
		aria-label={ts('card.dragLabel')}
		style="-webkit-touch-callout: none; -webkit-user-select: none; touch-action: pan-y;"
	>
		{@render strip(drag.isDragging)}
	</div>
{/if}

<!-- Floating card for touch drag -->
{#if drag.touchDragPos}
	<div
		class="rounded-control border-accent pointer-events-none fixed z-[100] w-[150px] -translate-x-1/2 -translate-y-1/2 -rotate-4 overflow-hidden border-2 shadow-[0_0_26px_rgb(255_43_214/0.7),0_10px_30px_rgb(0_0_0/0.6)]"
		style="left: {drag.touchDragPos.x}px; top: {drag.touchDragPos.y}px;"
	>
		<img {src} alt="" class="block aspect-video w-full object-cover" />
	</div>
{/if}
