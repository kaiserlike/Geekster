<script lang="ts">
	import {
		getState,
		placeGame,
		advanceToNextGame,
		submitBonusGuess,
		skipBonusGuess
	} from '$lib/game.svelte';
	import type { RoundScore } from '$lib/types';
	import TimelineSlot from './TimelineSlot.svelte';
	import GameCard from './GameCard.svelte';
	import BonusGuessPanel from './BonusGuessPanel.svelte';
	import ScoreReveal from './ScoreReveal.svelte';
	import { base } from '$app/paths';
	import { fly, fade } from 'svelte/transition';

	let feedbackMessage: string | null = $state(null);
	let feedbackType: 'correct' | 'wrong' | null = $state(null);
	let revealing: boolean = $state(false);
	let bonusGuessing: boolean = $state(false);
	let bonusRevealing: boolean = $state(false);
	let lastRoundScore: RoundScore | null = $state(null);

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

		// Show bonus guess panel instead of auto-advancing
		bonusGuessing = true;
	}

	function handleBonusSubmit(yearGuess: number | null, nameGuess: string | null) {
		submitBonusGuess({ yearGuess, nameGuess });
		showBonusResults();
	}

	function handleBonusSkip() {
		skipBonusGuess();
		showBonusResults();
	}

	function showBonusResults() {
		bonusGuessing = false;
		const s = getState();
		lastRoundScore = s.roundScores[s.roundScores.length - 1] ?? null;
		bonusRevealing = true;

		// Show the answer + score for 3.5s, then advance
		setTimeout(() => {
			feedbackMessage = null;
			feedbackType = null;
			bonusRevealing = false;
			revealing = false;
			lastRoundScore = null;
			advanceToNextGame();
		}, 3500);
	}

	// --- HTML5 Drag & Drop (desktop) ---

	let dragGhost: HTMLElement | null = null;

	function handleDragStart(e: DragEvent) {
		if (revealing || bonusGuessing || !gameState.currentGame) return;
		isDragging = true;
		if (cardRef && e.dataTransfer) {
			// Create a smaller clone as the drag image
			dragGhost = cardRef.cloneNode(true) as HTMLElement;
			dragGhost.style.width = '150px';
			dragGhost.style.position = 'absolute';
			dragGhost.style.top = '-9999px';
			dragGhost.style.opacity = '0.8';
			document.body.appendChild(dragGhost);
			e.dataTransfer.setDragImage(dragGhost, 75, 40);
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', 'game');
		}
	}

	function handleDragEnd() {
		isDragging = false;
		highlightedSlotIndex = null;
		if (dragGhost) {
			document.body.removeChild(dragGhost);
			dragGhost = null;
		}
	}

	// --- Touch Drag (mobile) ---

	function preventContextMenu(e: Event) {
		e.preventDefault();
	}

	function handleTouchStart(e: TouchEvent) {
		if (revealing || bonusGuessing || !gameState.currentGame) return;
		const touch = e.touches[0];
		touchStartPos = { x: touch.clientX, y: touch.clientY };
		dragStarted = false;

		// Prevent context menu / text selection popups on long-press
		window.addEventListener('contextmenu', preventContextMenu, { capture: true });

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
		// Delay removal so contextmenu event (which fires after touchend) is still caught
		setTimeout(() => {
			window.removeEventListener('contextmenu', preventContextMenu, { capture: true });
		}, 100);
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
		const threshold = 150;
		const minSpeed = 6;
		const maxSpeed = 20;
		// Use visualViewport for accurate mobile viewport (excludes browser chrome)
		const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
		const viewportTop = window.visualViewport?.offsetTop ?? 0;
		const relativeY = y - viewportTop;
		if (relativeY < threshold) {
			const intensity = 1 - relativeY / threshold;
			const speed = minSpeed + intensity * (maxSpeed - minSpeed);
			autoScrollInterval = setInterval(() => window.scrollBy(0, -speed), 16);
		} else if (relativeY > viewportHeight - threshold) {
			const intensity = 1 - (viewportHeight - relativeY) / threshold;
			const speed = minSpeed + intensity * (maxSpeed - minSpeed);
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
			<!-- Score -->
			<p class="text-sm font-bold text-purple-400 tabular-nums">
				{gameState.totalScore.toLocaleString()} pts
			</p>
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
			oncontextmenu={(e) => e.preventDefault()}
			role="application"
			aria-label="Drag this game to place it in the timeline"
			style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none; touch-action: pan-y;"
		>
			<p class="mb-3 text-center text-sm tracking-wide text-gray-400 uppercase">
				{isDragging ? 'Drop on a slot below' : 'Place this game in the timeline'}
			</p>
			<div class="mx-auto max-w-2xl cursor-grab active:cursor-grabbing" bind:this={cardRef}>
				<GameCard game={gameState.currentGame} hideYear={true} highlight={true} />
			</div>
		</div>
	{/if}

	<!-- Bonus Guess Panel -->
	{#if bonusGuessing}
		<div class="mb-6">
			<BonusGuessPanel
				onSubmit={handleBonusSubmit}
				onSkip={handleBonusSkip}
				placementCorrect={gameState.lastPlacementCorrect === true}
			/>
		</div>
	{/if}

	<!-- Bonus Results + Score Reveal -->
	{#if bonusRevealing && lastRoundScore}
		<div class="mb-6 space-y-4">
			<!-- Answer reveal -->
			<div
				class="mx-auto w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-4"
				in:fly={{ y: 30, duration: 300 }}
			>
				<p class="mb-3 text-center text-xs font-semibold tracking-wide text-gray-400 uppercase">
					Answer
				</p>
				<div class="mb-3 text-center">
					<p class="text-lg font-bold text-white">{lastRoundScore.actualName}</p>
					<p class="text-2xl font-black text-purple-400">{lastRoundScore.actualYear}</p>
				</div>

				<!-- Guess results -->
				{#if lastRoundScore.yearGuess !== null || lastRoundScore.nameGuess}
					<div class="space-y-2 border-t border-gray-700 pt-3">
						{#if lastRoundScore.yearGuess !== null}
							{@const yearDiff = Math.abs(lastRoundScore.yearGuess - lastRoundScore.actualYear)}
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-400">
									Year guess: <span class="font-bold text-white">{lastRoundScore.yearGuess}</span>
								</span>
								<span
									class="font-bold {yearDiff === 0
										? 'text-green-400'
										: yearDiff <= 2
											? 'text-yellow-400'
											: 'text-red-400'}"
								>
									{yearDiff === 0
										? 'Exact!'
										: `Off by ${yearDiff} ${yearDiff === 1 ? 'year' : 'years'}`}
								</span>
							</div>
						{/if}
						{#if lastRoundScore.nameGuess}
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-400">
									Name guess: <span class="font-bold text-white">"{lastRoundScore.nameGuess}"</span>
								</span>
								<span
									class="font-bold {lastRoundScore.nameBonus >= 50
										? 'text-green-400'
										: lastRoundScore.nameBonus >= 20
											? 'text-yellow-400'
											: 'text-red-400'}"
								>
									{lastRoundScore.nameBonus >= 50
										? 'Exact!'
										: lastRoundScore.nameBonus >= 20
											? 'Close!'
											: 'Nope'}
								</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Score breakdown -->
			<ScoreReveal roundScore={lastRoundScore} />
		</div>
	{/if}

	<!-- Timeline -->
	<div class="flex flex-1 flex-col items-center">
		<div class="w-full max-w-md">
			<div class="relative flex flex-col items-center gap-0">
				<!-- First slot (before all games) -->
				{#if gameState.currentGame && !revealing && !bonusGuessing}
					<TimelineSlot
						onPlace={() => handlePlace(0)}
						slotIndex={0}
						highlighted={highlightedSlotIndex === 0}
						expanded={isDragging}
					/>
				{/if}

				{#each gameState.timeline as game, i (game.id)}
					{@const isLastPlaced = gameState.lastPlacedGameId === game.id}
					<div class="w-full py-1">
						<GameCard
							{game}
							hideYear={isLastPlaced && (bonusGuessing || bonusRevealing)}
							highlight={false}
							revealed={isLastPlaced && bonusRevealing}
							minified={isDragging}
							compact={true}
						/>

						<!-- Slot after this game -->
						{#if gameState.currentGame && !revealing && !bonusGuessing}
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
				src="{base}{gameState.currentGame.screenshot}"
				alt=""
				class="rounded-lg border-2 border-purple-500"
			/>
		</div>
	{/if}
</div>
