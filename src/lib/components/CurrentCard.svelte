<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { RunCard } from '$lib/types';
	import type { DragPlace } from '$lib/dragPlace.svelte';
	import { tf, ts } from '$lib/i18n.svelte';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import { fly } from '$lib/motion';
	import Chip from './ui/Chip.svelte';
	import IconButton from './ui/IconButton.svelte';
	import Lightbox from './ui/Lightbox.svelte';

	interface Props {
		/** The card to place: an image, its name and year are the server's until it is placed */
		game: RunCard;
		/** Its number in the run: the anchor is card 1 */
		cardNumber: number;
		drag: DragPlace;
		/** The placement has been with the server a while (10b-2): the card says it is being checked */
		busy?: boolean;
		/** The compact HUD, shown in the bar pinned to the top once the card has scrolled off */
		pinnedHud?: Snippet;
	}

	let { game, cardNumber, drag, busy = false, pinnedHud }: Props = $props();

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

	// The card shrinks to a strip while dragging, so more of the timeline shows (U9) — decided once,
	// when the drag starts, and only if the card's top is in view. Shrinking a card that is partly
	// scrolled off moves the slots under the pointer, and could push it off entirely: the pinned
	// bar then came in, the card grew back into view, and the two took turns (feedback, 2026-10-02)
	let shrinkOnDrag: boolean = $state(false);
	const stripInFlow = $derived(drag.isDragging && shrinkOnDrag && !stripHeld);

	function decideShrink() {
		shrinkOnDrag = !scrolledPast && (block?.getBoundingClientRect().top ?? -1) >= 0;
	}
	const src = $derived(resolveScreenshotUrl(game.screenshot));

	// The screenshot at full size: from the button, or a click on the image. A click that ends a
	// drag (a touch long-press lets go, and some browsers still click) opens nothing
	const DRAG_CLICK_GUARD_MS = 400;
	let zoomed: boolean = $state(false);
	let dragEndedAt = 0;
	$effect(() => {
		if (!drag.isDragging) dragEndedAt = performance.now();
	});
	function openZoom() {
		if (drag.isDragging || performance.now() - dragEndedAt < DRAG_CLICK_GUARD_MS) return;
		zoomed = true;
	}
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
				{#if dragging}
					{ts('card.draggingHint')}
				{:else}
					<span class="pointer-fine:hidden">{ts('card.hintTouch')}</span>
					<span class="pointer-coarse:hidden">{ts('card.hintPointer')}</span>
				{/if}
			</span>
		</div>
	</div>
{/snippet}

<!-- Drag source: the whole block. Hidden parts stay in the DOM, so a touch drag keeps its target -->
<div
	bind:this={block}
	in:fly={{ y: -60, duration: 400 }}
	draggable="true"
	ondragstart={(e) => {
		decideShrink();
		drag.dragStart(e, cardRef);
	}}
	ondragend={drag.dragEnd}
	ontouchstart={(e) => {
		decideShrink();
		drag.touchStart(e);
	}}
	oncontextmenu={(e) => e.preventDefault()}
	role="application"
	aria-label={ts('card.dragLabel')}
	class="flex cursor-grab flex-col gap-2 select-none active:cursor-grabbing lg:mx-auto lg:w-full lg:max-w-[calc((100dvh-26rem)*16/9)]"
	style="-webkit-touch-callout: none; -webkit-user-select: none; touch-action: pan-y;"
>
	<div
		class="font-ui flex justify-between text-xs font-bold tracking-[2px] uppercase {stripInFlow
			? 'hidden'
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
			: 'border-accent shadow-glow-card'} {stripInFlow ? 'hidden' : ''}"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
		<img
			{src}
			alt={ts('card.alt')}
			class="block aspect-video w-full object-cover {drag.isDragging ? 'opacity-30' : ''}"
			draggable="false"
			onclick={openZoom}
		/>
		<Chip tone="mystery" size="md" class="absolute top-2 left-2 lg:top-2.5 lg:left-2.5">????</Chip>
		{#if busy}
			<div class="bg-bg/60 absolute inset-0 flex items-center justify-center">
				<span
					role="status"
					class="rounded-chip bg-surface-raised text-ink font-ui flex items-center gap-2 px-3 py-1.5 text-sm font-bold tracking-[1.5px] uppercase"
				>
					<svg class="size-4.5 motion-safe:animate-spin" viewBox="0 0 18 18" aria-hidden="true">
						<circle
							cx="9"
							cy="9"
							r="7"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-dasharray="30 14"
						/>
					</svg>
					{ts('game.checking')}
				</span>
			</div>
		{/if}
		<!-- The keyboard's and the screen reader's way to the full size; the image click is a shortcut -->
		<IconButton
			label={ts('card.zoom')}
			onclick={openZoom}
			class="bg-bg/85 absolute top-2 right-2 lg:top-2.5 lg:right-2.5 {drag.isDragging
				? 'invisible'
				: ''}"
		>
			<svg
				class="size-4.5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
			</svg>
		</IconButton>
	</div>

	<div class={stripInFlow ? '' : 'hidden'}>
		{@render strip(true)}
	</div>

	<p class="text-ink-muted text-[13px] lg:text-sm {stripInFlow ? 'hidden' : ''}">
		<span class="pointer-fine:hidden">{ts('card.hintTouch')}</span>
		<span class="pointer-coarse:hidden">
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

<!--
	The card scrolled off the top: a bar pinned there with the compact HUD and the card's strip,
	on every screen. The strip can be dragged too
-->
{#if scrolledPast || stripHeld}
	<div
		class="bg-bg fixed inset-x-0 top-0 z-40 pt-2 pb-2"
		transition:fly={{ y: -24, duration: 200 }}
	>
		<div class="max-w-run mx-auto flex flex-col gap-2 px-4" data-pinned-bar>
			{@render pinnedHud?.()}
			<div
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
				class="cursor-grab active:cursor-grabbing"
				style="-webkit-touch-callout: none; -webkit-user-select: none; touch-action: pan-y;"
			>
				{@render strip(drag.isDragging)}
			</div>
		</div>
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

<Lightbox
	bind:open={zoomed}
	{src}
	alt={ts('card.alt')}
	closeLabel={ts('card.zoomClose')}
	description={ts('card.zoomHint')}
>
	{#snippet badge()}
		<Chip tone="mystery" size="md">????</Chip>
	{/snippet}
</Lightbox>
