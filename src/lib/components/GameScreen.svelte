<script lang="ts">
	import { getState, placeGame, advanceToNextGame } from '$lib/game.svelte';
	import TimelineSlot from './TimelineSlot.svelte';
	import GameCard from './GameCard.svelte';
	import { fly, fade } from 'svelte/transition';

	let feedbackMessage: string | null = $state(null);
	let feedbackType: 'correct' | 'wrong' | null = $state(null);
	let revealing: boolean = $state(false);

	const gameState = $derived(getState());

	function handlePlace(slotIndex: number) {
		placeGame(slotIndex);
		const s = getState();

		if (s.lastPlacementCorrect) {
			feedbackMessage = 'Correct!';
			feedbackType = 'correct';
		} else {
			feedbackMessage = 'Wrong! The game was placed in its correct spot.';
			feedbackType = 'wrong';
		}

		revealing = true;

		setTimeout(() => {
			feedbackMessage = null;
			feedbackType = null;
			revealing = false;
			advanceToNextGame();
		}, 2000);
	}
</script>

<div class="flex min-h-screen flex-col px-4 py-6">
	<!-- Header -->
	<div class="mb-6 text-center">
		<h1
			class="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-2xl font-bold text-transparent"
		>
			Geekster
		</h1>
		<p class="mt-1 text-sm text-gray-400">
			Placed: {gameState.correctPlacements} / {gameState.targetPlacements}
		</p>
	</div>

	<!-- Feedback banner -->
	{#if feedbackMessage}
		<div
			in:fly={{ y: -40, duration: 300 }}
			out:fade={{ duration: 200 }}
			class="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-6 py-3 text-lg font-bold shadow-lg {feedbackType ===
			'correct'
				? 'bg-green-600'
				: 'bg-red-600'}"
		>
			{feedbackMessage}
		</div>
	{/if}

	<!-- Current game to place -->
	{#if gameState.currentGame}
		<div
			class="sticky top-0 z-40 mb-8 bg-gray-950/80 pb-4 backdrop-blur-sm"
			in:fly={{ y: -60, duration: 400 }}
		>
			<p class="mb-3 text-center text-sm tracking-wide text-gray-400 uppercase">
				Place this game in the timeline
			</p>
			<div class="mx-auto max-w-sm">
				<GameCard game={gameState.currentGame} hideYear={true} highlight={true} />
			</div>
		</div>
	{/if}

	<!-- Timeline -->
	<div class="flex flex-1 flex-col items-center">
		<div class="w-full max-w-2xl">
			<div class="relative flex flex-col items-center gap-0">
				<!-- First slot (before all games) -->
				{#if gameState.currentGame && !revealing}
					<TimelineSlot onPlace={() => handlePlace(0)} />
				{/if}

				{#each gameState.timeline as game, i (game.id)}
					<div class="w-full py-1">
						<GameCard
							{game}
							hideYear={false}
							highlight={false}
							revealed={gameState.lastPlacedGameId === game.id}
						/>

						<!-- Slot after this game -->
						{#if gameState.currentGame && !revealing}
							<div class="mt-1">
								<TimelineSlot onPlace={() => handlePlace(i + 1)} />
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
