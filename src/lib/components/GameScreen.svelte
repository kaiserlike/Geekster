<script lang="ts">
	import { getState, placeGame, advanceToNextGame } from '$lib/game.svelte';
	import TimelineSlot from './TimelineSlot.svelte';
	import GameCard from './GameCard.svelte';
	import { fly, fade } from 'svelte/transition';

	let feedbackMessage: string | null = $state(null);
	let feedbackType: 'correct' | 'wrong' | null = $state(null);
	let revealing: boolean = $state(false);

	// Drag & drop state
	let isDragging: boolean = $state(false);
	let touchDragPos: { x: number; y: number } | null = $state(null);
	let highlightedSlotIndex: number | null = $state(null);
	let touchStartPos: { x: number; y: number } | null = $state(null);
	let dragStarted: boolean = $state(false);
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	let autoScrollInterval: ReturnType<typeof setInterval> | null = null;
	let cardRef: HTMLDivElement | undefined = $state(undefined);

	const gameState = $derived(getState());

	function handlePlace(slotIndex: number) {
		// Ensure drag state is clean
		isDragging = false;
		highlightedSlotIndex = null;
		stopAutoScroll();

		placeGame(slotIndex);
		const s = getState();

		if (s.lastPlacementCorrect) {
			feedbackMessage = 'Correct!';
			feedbackType = 'correct';
		} else {
			const livesLeft = s.lives;
			feedbackMessage =
				livesLeft > 0
					? `Wrong! ${livesLeft} ${livesLeft === 1 ? 'life' : 'lives'} remaining`
					: 'Wrong! No lives left!';
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

	// --- HTML5 Drag & Drop (desktop) ---

	function handleDragStart(e: DragEvent) {
		if (revealing || !gameState.currentGame) return;
		isDragging = true;
		if (cardRef && e.dataTransfer) {
			e.dataTransfer.setDragImage(cardRef, cardRef.offsetWidth / 2, cardRef.offsetHeight / 2);
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', 'game');
		}
	}

	function handleDragEnd() {
		isDragging = false;
		highlightedSlotIndex = null;
	}

	// --- Touch Drag (mobile) ---

	function handleTouchStart(e: TouchEvent) {
		if (revealing || !gameState.currentGame) return;
		const touch = e.touches[0];
		touchStartPos = { x: touch.clientX, y: touch.clientY };
		dragStarted = false;

		longPressTimer = setTimeout(() => {
			dragStarted = true;
			isDragging = true;
			touchDragPos = touchStartPos ? { ...touchStartPos } : null;
			if (navigator.vibrate) navigator.vibrate(30);
		}, 250);

		window.addEventListener('touchmove', handleTouchMove, { passive: false });
		window.addEventListener('touchend', handleTouchEnd);
		window.addEventListener('touchcancel', cleanupTouchDrag);
	}

	function handleTouchMove(e: TouchEvent) {
		const touch = e.touches[0];

		if (!dragStarted) {
			// If moved too far before long press, cancel (it's a scroll)
			if (touchStartPos) {
				const dx = touch.clientX - touchStartPos.x;
				const dy = touch.clientY - touchStartPos.y;
				if (Math.sqrt(dx * dx + dy * dy) > 10) {
					cleanupTouchDrag();
				}
			}
			return;
		}

		e.preventDefault();
		touchDragPos = { x: touch.clientX, y: touch.clientY };
		highlightedSlotIndex = findSlotUnderPoint(touch.clientX, touch.clientY);
		handleAutoScroll(touch.clientY);
	}

	function handleTouchEnd() {
		if (dragStarted && highlightedSlotIndex !== null) {
			handlePlace(highlightedSlotIndex);
		}
		cleanupTouchDrag();
	}

	function cleanupTouchDrag() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		isDragging = false;
		dragStarted = false;
		touchDragPos = null;
		highlightedSlotIndex = null;
		touchStartPos = null;
		stopAutoScroll();

		window.removeEventListener('touchmove', handleTouchMove);
		window.removeEventListener('touchend', handleTouchEnd);
		window.removeEventListener('touchcancel', cleanupTouchDrag);
	}

	function findSlotUnderPoint(x: number, y: number): number | null {
		const slots = document.querySelectorAll('[data-slot-index]');
		for (const slot of slots) {
			const rect = slot.getBoundingClientRect();
			const padding = 10;
			if (
				x >= rect.left &&
				x <= rect.right &&
				y >= rect.top - padding &&
				y <= rect.bottom + padding
			) {
				return parseInt(slot.getAttribute('data-slot-index')!);
			}
		}
		return null;
	}

	function handleAutoScroll(y: number) {
		stopAutoScroll();
		const threshold = 60;
		const speed = 8;
		if (y < threshold) {
			autoScrollInterval = setInterval(() => window.scrollBy(0, -speed), 16);
		} else if (y > window.innerHeight - threshold) {
			autoScrollInterval = setInterval(() => window.scrollBy(0, speed), 16);
		}
	}

	function stopAutoScroll() {
		if (autoScrollInterval) {
			clearInterval(autoScrollInterval);
			autoScrollInterval = null;
		}
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
		<div class="mt-2 flex items-center justify-center gap-4">
			<!-- Lives -->
			<div class="flex items-center gap-1.5">
				{#each Array.from({ length: gameState.maxLives }, (_v, i) => i) as i (i)}
					<div
						class="h-3 w-3 rounded-full {i < gameState.lives ? 'bg-red-500' : 'bg-gray-700'}"
					></div>
				{/each}
			</div>
			<p class="text-sm text-gray-400">
				{gameState.correctPlacements} / {gameState.targetPlacements}
			</p>
			{#if gameState.streak > 1}
				<p class="text-sm font-bold text-orange-400">
					{gameState.streak}x streak
				</p>
			{/if}
		</div>
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
			class="sticky top-0 z-40 mb-8 bg-gray-950/80 pb-4 backdrop-blur-sm {isDragging
				? 'opacity-50'
				: ''}"
			in:fly={{ y: -60, duration: 400 }}
			draggable="true"
			ondragstart={handleDragStart}
			ondragend={handleDragEnd}
			ontouchstart={handleTouchStart}
			role="application"
			aria-label="Drag this game to place it in the timeline"
		>
			<p class="mb-3 text-center text-sm tracking-wide text-gray-400 uppercase">
				{isDragging ? 'Drop on a slot below' : 'Place this game in the timeline'}
			</p>
			<div class="mx-auto max-w-sm cursor-grab active:cursor-grabbing" bind:this={cardRef}>
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
					<TimelineSlot
						onPlace={() => handlePlace(0)}
						slotIndex={0}
						highlighted={highlightedSlotIndex === 0}
						expanded={isDragging}
					/>
				{/if}

				{#each gameState.timeline as game, i (game.id)}
					<div class="w-full py-1">
						<GameCard
							{game}
							hideYear={false}
							highlight={false}
							revealed={gameState.lastPlacedGameId === game.id}
							minified={isDragging}
						/>

						<!-- Slot after this game -->
						{#if gameState.currentGame && !revealing}
							<div class="mt-1">
								<TimelineSlot
									onPlace={() => handlePlace(i + 1)}
									slotIndex={i + 1}
									highlighted={highlightedSlotIndex === i + 1}
									expanded={isDragging}
								/>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Floating card for touch drag -->
	{#if touchDragPos && gameState.currentGame}
		<div
			class="pointer-events-none fixed z-[100] w-28 -translate-x-1/2 -translate-y-1/2 rounded-lg opacity-80 shadow-2xl shadow-purple-500/30"
			style="left: {touchDragPos.x}px; top: {touchDragPos.y}px;"
		>
			<img
				src={gameState.currentGame.screenshot}
				alt=""
				class="rounded-lg border-2 border-purple-500"
			/>
		</div>
	{/if}
</div>
