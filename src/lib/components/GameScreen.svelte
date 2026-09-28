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
			// Show bonus guess panel for correct placements only. It is where the card was, at the
			// top: the only scroll here, and it gives nothing away
			bonusGuessing = true;
			window.scrollTo({ top: 0, behavior: scrollBehavior() });
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
		// The one scroll a reveal is allowed: to the answer card at the top, or on a miss to the
		// ghost and the card
		if (s.lastPlacementCorrect) {
			window.scrollTo({ top: 0, behavior: scrollBehavior() });
		} else {
			timeline?.revealInView();
		}
	}

	// "Next card" answers Enter (and Space, as a focused button does) from the moment it is there:
	// at once on a miss, after the breakdown on a correct placement
	$effect(() => {
		if (bonusRevealing && nextButton) nextButton.focus({ preventScroll: true });
	});

	function handleNextGame() {
		// The Enter that submitted the guess must not also skip the reveal
		if (performance.now() - revealedAt < NEXT_GUARD_MS) return;
		feedback = null;
		bonusRevealing = false;
		lastRoundScore = null;
		ghostAt = null;
		advanceToNextGame();
		// The next card is at the top
		window.scrollTo({ top: 0, behavior: 'instant' });
	}

	function scrollBehavior(): 'instant' | 'smooth' {
		return prefersReducedMotion.current ? 'instant' : 'smooth';
	}
</script>

{#snippet nextCard()}
	<Button bind:ref={nextButton} variant="primary" fullWidth onclick={handleNextGame}>
		{isLastRound ? ts('game.showResult') : ts('game.nextGame')}
		<span aria-hidden="true">→</span>
	</Button>
{/snippet}

{#snippet hud(compact: boolean)}
	<RunHud
		lives={gameState.lives}
		maxLives={gameState.maxLives}
		streak={gameState.streak}
		totalScore={gameState.totalScore}
		{moment}
		{compact}
	/>
{/snippet}

<!--
	One column on every screen (user decision, 2026-09-28): the card on top, the timeline under
	it, dragged top to bottom. A desktop gets it larger, within 880 px. Once the card scrolls off,
	a bar pinned to the top carries the compact HUD and the card's strip
-->
<div class="mx-auto flex w-full max-w-[912px] flex-col gap-3 px-4 pt-2 pb-6">
	{#if !keyboardOpen}
		{@render hud(drag.isDragging)}
	{/if}

	<!-- Floats over the top-left corner: in the flow, its coming and going moved the bonus panel
	     under the player's finger (user review, 2026-09-28) -->
	<FeedbackToast message={feedback} />

	<div>
		{#if gameState.currentGame}
			<CurrentCard game={gameState.currentGame} cardNumber={gameState.timeline.length + 1} {drag}>
				{#snippet pinnedHud()}
					{@render hud(true)}
				{/snippet}
			</CurrentCard>
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
			>
				{#snippet next()}
					{@render nextCard()}
				{/snippet}
			</ScoreReveal>
		{/if}
	</div>

	<div class="mt-3">
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

	{#if bonusRevealing && gameState.lastPlacementCorrect === false}
		<!-- A miss: pinned to the bottom, wherever the reveal scrolled to (the ghost may be far down) -->
		<div class="bg-bg sticky bottom-0 -mx-4 px-4 py-3">
			{@render nextCard()}
		</div>
	{/if}
</div>
