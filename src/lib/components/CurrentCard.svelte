<script lang="ts">
	import type { Game } from '$lib/types';
	import type { DragPlace } from '$lib/dragPlace.svelte';
	import { ts } from '$lib/i18n.svelte';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import GameCard from './GameCard.svelte';
	import { fly } from 'svelte/transition';

	interface Props {
		/** The game to place; its year stays hidden */
		game: Game;
		drag: DragPlace;
	}

	let { game, drag }: Props = $props();

	let cardRef: HTMLDivElement | undefined = $state(undefined);
</script>

<div
	class="sticky top-0 z-40 mb-8 bg-gray-950/80 pb-4 backdrop-blur-sm {drag.isDragging
		? 'opacity-50'
		: ''}"
	in:fly={{ y: -60, duration: 400 }}
	draggable="true"
	ondragstart={(e) => drag.dragStart(e, cardRef)}
	ondragend={drag.dragEnd}
	ontouchstart={drag.touchStart}
	oncontextmenu={(e) => e.preventDefault()}
	role="application"
	aria-label="Drag this game to place it in the timeline"
	style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none; touch-action: pan-y;"
>
	<p class="mb-3 text-center text-sm tracking-wide text-gray-400 uppercase">
		{drag.isDragging ? ts('game.dropOnSlot') : ts('game.placeInTimeline')}
	</p>
	<div class="mx-auto max-w-2xl cursor-grab active:cursor-grabbing" bind:this={cardRef}>
		<GameCard {game} hideYear={true} highlight={true} />
	</div>
</div>

<!-- Floating card for touch drag -->
{#if drag.touchDragPos}
	<div
		class="pointer-events-none fixed z-[100] w-28 -translate-x-1/2 -translate-y-1/2 rounded-lg opacity-80 shadow-2xl shadow-purple-500/30"
		style="left: {drag.touchDragPos.x}px; top: {drag.touchDragPos.y}px;"
	>
		<img
			src={resolveScreenshotUrl(game.screenshot)}
			alt=""
			class="rounded-lg border-2 border-purple-500"
		/>
	</div>
{/if}
