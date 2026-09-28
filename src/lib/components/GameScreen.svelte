<script lang="ts">
	import {
		getLastPlacedGame,
		getState,
		placeGame,
		advanceToNextGame,
		submitBonusGuess,
		skipBonusGuess
	} from '$lib/game.svelte';
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { RoundScore, ToastMessage } from '$lib/types';
	import { formatMultiplier, tf, ts } from '$lib/i18n.svelte';
	import BonusGuessPanel from './BonusGuessPanel.svelte';
	import CurrentCard from './CurrentCard.svelte';
	import FeedbackToast from './FeedbackToast.svelte';
	import RunHud from './RunHud.svelte';
	import ScoreReveal from './ScoreReveal.svelte';
	import Timeline from './Timeline.svelte';
	import { DragPlace } from '$lib/dragPlace.svelte';
	import { headerScore } from '$lib/headerScore.svelte';
	import { ghostSlotIndex, hudMoment, runOutcome, streakMeter } from '$lib/placement';
	import { PLACEMENT_POINTS } from '$lib/scoring';
	import Button from './ui/Button.svelte';

	// The two-column shell with its own timeline pane (9a's design call)
	const desktop = new MediaQuery('min-width: 1024px');
	// A reveal ignores "Next card" this long, so the Enter that submitted the guess doesn't skip it
	const NEXT_GUARD_MS = 300;

	let feedback: ToastMessage | null = $state(null);
	let bonusGuessing: boolean = $state(false);
	let bonusRevealing: boolean = $state(false);
	let lastRoundScore: RoundScore | null = $state(null);
	// A wrong placement: the slot the player chose, in the timeline that now holds the card
	let ghostAt: number | null = $state(null);
	// The phone keyboard is up for the bonus guess: the HUD collapses into the header
	let keyboardOpen: boolean = $state(false);
	let revealedAt = 0;
	let timeline: ReturnType<typeof Timeline> | undefined = $state(undefined);
	let nextButton: HTMLButtonElement | null = $state(null);

	const gameState = $derived(getState());
	const isLastRound = $derived(
		runOutcome(gameState.lives, gameState.remainingGames.length) !== null
	);
	// Between a placement and the next card, the HUD marks what it did
	const moment = $derived(
		hudMoment(
			gameState.lastPlacedGameId !== null ? gameState.lastPlacementCorrect : null,
			gameState.streak,
			gameState.lifeRegained
		)
	);

	const drag = new DragPlace({
		canDrag: () => !bonusRevealing && !bonusGuessing && gameState.currentGame !== null,
		onDrop: handlePlace
	});

	$effect(() => {
		headerScore.value = keyboardOpen ? gameState.totalScore : null;
	});
	$effect(() => () => (headerScore.value = null));

	function placementToast(): ToastMessage {
		const s = getState();
		const placed = getLastPlacedGame();
		if (!s.lastPlacementCorrect) {
			return {
				tone: 'wrong',
				title: ts('toast.wrong'),
				detail: placed
					? tf<(name: string, year: number, livesLeft: number) => string>('toast.wrongDetail')(
							placed.name,
							placed.year,
							s.lives
						)
					: undefined
			};
		}
		const inARow = tf<(n: number) => string>('toast.inARow')(s.streak);
		switch (hudMoment(true, s.streak, s.lifeRegained)) {
			case 'lifeBack':
				return { tone: 'life', title: inARow, detail: ts('toast.lifeBack') };
			case 'tenInARow':
				return {
					tone: 'streak',
					title: inARow,
					detail: tf<(m: string) => string>('toast.livesFull')(
						formatMultiplier(streakMeter(s.streak, s.lives, s.maxLives).multiplier)
					)
				};
			default:
				return {
					tone: 'correct',
					title: ts('toast.correct'),
					detail: tf<(points: number, streak: number) => string>('toast.correctDetail')(
						PLACEMENT_POINTS,
						s.streak
					)
				};
		}
	}

	function handlePlace(slotIndex: number) {
		// Ensure drag state is clean
		drag.reset();

		placeGame(slotIndex);
		feedback = placementToast();

		const s = getState();
		if (s.lastPlacementCorrect) {
			// Show bonus guess panel for correct placements only. On a phone it is where the card
			// was, at the top: the only scroll here, and it gives nothing away
			bonusGuessing = true;
			if (!desktop.current) window.scrollTo({ top: 0, behavior: scrollBehavior() });
		} else {
			// Skip bonus guess on wrong placement — go straight to the reveal, with a ghost where
			// the player put it (U8)
			const insertedAt = s.timeline.findIndex((g) => g.id === s.lastPlacedGameId);
			ghostAt = ghostSlotIndex(slotIndex, insertedAt);
			skipBonusGuess();
			showBonusResults();
		}
	}

	function handleBonusSubmit(yearGuess: number | null, nameGuess: string | null) {
		submitBonusGuess({ yearGuess, nameGuess });
		showBonusResults();
	}

	function handleBonusSkip() {
		skipBonusGuess();
		showBonusResults();
	}

	async function showBonusResults() {
		bonusGuessing = false;
		keyboardOpen = false;
		const s = getState();
		lastRoundScore = s.roundScores[s.roundScores.length - 1] ?? null;
		bonusRevealing = true;
		revealedAt = performance.now();
		await tick();
		// The one scroll a reveal is allowed: on a phone to the answer card at the top, or on a
		// miss to the ghost and the card; on desktop the pane, to the card just placed
		if (!desktop.current && s.lastPlacementCorrect) {
			window.scrollTo({ top: 0, behavior: scrollBehavior() });
		} else {
			timeline?.revealInView();
		}
		// "Next card" answers Enter from here on (and Space, as a focused button does)
		nextButton?.focus({ preventScroll: true });
	}

	function handleNextGame() {
		// The Enter that submitted the guess must not also skip the reveal
		if (performance.now() - revealedAt < NEXT_GUARD_MS) return;
		feedback = null;
		bonusRevealing = false;
		lastRoundScore = null;
		ghostAt = null;
		advanceToNextGame();
		// The next card is at the top of a phone. The desktop pane stays where it is
		if (!desktop.current) window.scrollTo({ top: 0, behavior: 'instant' });
	}

	function scrollBehavior(): 'instant' | 'smooth' {
		return prefersReducedMotion.current ? 'instant' : 'smooth';
	}
</script>

<!--
	Phone: one column, the page scrolls. From 1024 px a fixed shell (9a's "Desktop with a long
	timeline"): the left column (HUD, the card, the bonus panel, the answer) never moves, and only
	the timeline pane on the right scrolls. The left column takes half the width, or less when the
	window is too short for a 16:9 card of that width under the HUD (24rem is the HUD, the labels,
	the hint and the header); the timeline takes the rest, all within 1760 px
-->
<div
	class="flex flex-col gap-3 px-4 pt-2 pb-6 lg:mx-auto lg:grid lg:h-full lg:w-full lg:max-w-[1840px] lg:grid-cols-[minmax(0,min(50%,calc((100dvh-24rem)*16/9)))_minmax(0,1fr)] lg:grid-rows-[auto_auto_minmax(0,auto)_1fr] lg:gap-x-12 lg:gap-y-4 lg:px-10 lg:pb-4"
>
	{#if !keyboardOpen}
		<div class="lg:col-start-1">
			<RunHud
				lives={gameState.lives}
				maxLives={gameState.maxLives}
				streak={gameState.streak}
				totalScore={gameState.totalScore}
				{moment}
				compact={drag.isDragging && !desktop.current}
			/>
		</div>
	{/if}

	<!-- The gap stays the same with or without a toast: only its own height comes and goes -->
	<FeedbackToast message={feedback} class="lg:col-start-1 {feedback ? '' : '-mb-3 lg:mb-0'}" />

	<!-- If the answer card and a toast don't fit a short window, this cell scrolls; the padding
	     keeps the card's glow from being clipped by it -->
	<div class="lg:col-start-1 lg:-m-6 lg:min-h-0 lg:overflow-y-auto lg:p-6">
		{#if gameState.currentGame}
			<CurrentCard game={gameState.currentGame} cardNumber={gameState.timeline.length + 1} {drag} />
		{:else if bonusGuessing}
			<BonusGuessPanel
				onSubmit={handleBonusSubmit}
				onSkip={handleBonusSkip}
				onKeyboard={(open) => (keyboardOpen = open)}
			/>
		{:else if bonusRevealing && lastRoundScore && gameState.lastPlacementCorrect}
			{@const placed = getLastPlacedGame()}
			<ScoreReveal
				roundScore={lastRoundScore}
				screenshot={placed?.screenshot ?? ''}
				streak={gameState.streak}
			/>
		{/if}
	</div>

	<div class="mt-3 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:min-h-0">
		<Timeline
			bind:this={timeline}
			timeline={gameState.timeline}
			lastPlacedGameId={gameState.lastPlacedGameId}
			showSlots={gameState.currentGame !== null && !bonusGuessing}
			{bonusGuessing}
			revealing={bonusRevealing}
			misplaced={gameState.lastPlacementCorrect === false}
			{ghostAt}
			{drag}
			onPlace={handlePlace}
		/>
	</div>

	{#if bonusRevealing}
		<!-- A phone keeps it pinned to the bottom, wherever the reveal scrolled to -->
		<div
			class="bg-bg max-lg:sticky max-lg:bottom-0 max-lg:-mx-4 max-lg:px-4 max-lg:py-3 lg:col-start-1 lg:row-start-4 lg:self-start"
		>
			<Button bind:ref={nextButton} variant="primary" fullWidth onclick={handleNextGame}>
				{isLastRound ? ts('game.showResult') : ts('game.nextGame')}
				<span aria-hidden="true">→</span>
			</Button>
		</div>
	{/if}
</div>
