<script lang="ts">
	import type { Game } from '$lib/types';
	import type { DragPlace } from '$lib/dragPlace.svelte';
	import { ts } from '$lib/i18n.svelte';
	import { COMPACT_TIMELINE_AT } from './GameCard.svelte';
	import TimelineRow from './TimelineRow.svelte';
	import TimelineSlot from './TimelineSlot.svelte';

	interface Props {
		timeline: Game[];
		lastPlacedGameId: number | null;
		/** Slots only while there is a card to place */
		showSlots: boolean;
		/** Bonus guess or reveal: the card just placed keeps its year hidden until the reveal */
		bonusGuessing: boolean;
		bonusRevealing: boolean;
		drag: DragPlace;
		onPlace: (slotIndex: number) => void;
	}

	let {
		timeline,
		lastPlacedGameId,
		showSlots,
		bonusGuessing,
		bonusRevealing,
		drag,
		onPlace
	}: Props = $props();

	const compactTimeline = $derived(timeline.length > COMPACT_TIMELINE_AT);
</script>

<div class="flex flex-1 flex-col items-center">
	<div class="w-full max-w-md">
		<!-- What "PLACED" in the HUD used to count: the cards the timeline already holds -->
		<h2 class="font-ui text-pink mb-2 text-xs font-bold tracking-[2px] uppercase">
			{ts('timeline.heading')} · <span class="tabular">{timeline.length}</span>
		</h2>
		<div class="relative flex flex-col items-center gap-0">
			<!-- First slot (before all games) -->
			{#if showSlots}
				<TimelineSlot
					onPlace={() => onPlace(0)}
					slotIndex={0}
					highlighted={drag.highlightedSlotIndex === 0}
					expanded={drag.isDragging}
				/>
			{/if}

			{#each timeline as game, i (game.id)}
				{@const isLastPlaced = lastPlacedGameId === game.id}
				<div class="w-full py-1">
					<TimelineRow
						{game}
						hideYear={isLastPlaced && (bonusGuessing || bonusRevealing)}
						revealed={isLastPlaced && bonusRevealing}
						minified={drag.isDragging || (compactTimeline && !isLastPlaced)}
					/>

					<!-- Slot after this game -->
					{#if showSlots}
						<div class="mt-1">
							<TimelineSlot
								onPlace={() => onPlace(i + 1)}
								slotIndex={i + 1}
								highlighted={drag.highlightedSlotIndex === i + 1}
								expanded={drag.isDragging}
							/>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
