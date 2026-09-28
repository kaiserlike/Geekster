<script lang="ts">
	import {
		getLastPlacedGame,
		getState,
		placeGame,
		advanceToNextGame,
		submitBonusGuess,
		skipBonusGuess
	} from '$lib/game.svelte';
	import type { RoundScore, ToastMessage } from '$lib/types';
	import { formatMultiplier, tf, ts } from '$lib/i18n.svelte';
	import BonusGuessPanel from './BonusGuessPanel.svelte';
	import CurrentCard from './CurrentCard.svelte';
	import FeedbackToast from './FeedbackToast.svelte';
	import RunHud from './RunHud.svelte';
	import ScoreReveal from './ScoreReveal.svelte';
	import Timeline from './Timeline.svelte';
	import { DragPlace } from '$lib/dragPlace.svelte';
	import { hudMoment, runOutcome, streakMeter } from '$lib/placement';
	import { PLACEMENT_POINTS } from '$lib/scoring';
	import { fly } from '$lib/motion';

	let feedback: ToastMessage | null = $state(null);
	let revealing: boolean = $state(false);
	let bonusGuessing: boolean = $state(false);
	let bonusRevealing: boolean = $state(false);
	let lastRoundScore: RoundScore | null = $state(null);

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
		canDrag: () => !revealing && !bonusGuessing && gameState.currentGame !== null,
		onDrop: handlePlace
	});

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

		if (getState().lastPlacementCorrect) {
			// Show bonus guess panel for correct placements only
			bonusGuessing = true;
		} else {
			// Skip bonus guess on wrong placement — go straight to reveal
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

	function showBonusResults() {
		bonusGuessing = false;
		const s = getState();
		lastRoundScore = s.roundScores[s.roundScores.length - 1] ?? null;
		bonusRevealing = true;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleNextGame() {
		feedback = null;
		bonusRevealing = false;
		revealing = false;
		lastRoundScore = null;
		advanceToNextGame();
	}
</script>

<div class="flex min-h-screen flex-col px-4 pt-2 pb-6">
	<!-- The card's width until 9d puts the HUD into the desktop layout's left column -->
	<div class="mx-auto w-full max-w-2xl">
		<RunHud
			lives={gameState.lives}
			maxLives={gameState.maxLives}
			streak={gameState.streak}
			totalScore={gameState.totalScore}
			{moment}
		/>

		<!-- The gap stays the same with or without a toast: only its own height comes and goes -->
		<FeedbackToast message={feedback} class="my-3" />
	</div>

	<!-- Current game to place -->
	{#if gameState.currentGame}
		<CurrentCard game={gameState.currentGame} {drag} />
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
					{ts('game.answer')}
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
									{ts('game.yearGuess')}
									<span class="font-bold text-white">{lastRoundScore.yearGuess}</span>
								</span>
								<span
									class="font-bold {yearDiff === 0
										? 'text-green-400'
										: yearDiff <= 2
											? 'text-yellow-400'
											: 'text-red-400'}"
								>
									{yearDiff === 0
										? ts('game.exact')
										: tf<(n: number) => string>('game.offByYears')(yearDiff)}
								</span>
							</div>
						{/if}
						{#if lastRoundScore.nameGuess}
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-400">
									{ts('game.nameGuess')}
									<span class="font-bold text-white">"{lastRoundScore.nameGuess}"</span>
								</span>
								<span
									class="font-bold {lastRoundScore.nameBonus >= 50
										? 'text-green-400'
										: lastRoundScore.nameBonus >= 20
											? 'text-yellow-400'
											: 'text-red-400'}"
								>
									{lastRoundScore.nameBonus >= 50
										? ts('game.exact')
										: lastRoundScore.nameBonus >= 20
											? ts('game.close')
											: ts('game.nope')}
								</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Score breakdown -->
			<ScoreReveal roundScore={lastRoundScore} />

			<!-- Next Game button -->
			<div class="flex justify-center">
				<button
					onclick={handleNextGame}
					class="rounded-lg bg-purple-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition-colors hover:bg-purple-500 active:bg-purple-700"
				>
					{isLastRound ? ts('game.showResult') : ts('game.nextGame')} →
				</button>
			</div>
		</div>
	{/if}

	<Timeline
		timeline={gameState.timeline}
		lastPlacedGameId={gameState.lastPlacedGameId}
		showSlots={gameState.currentGame !== null && !revealing && !bonusGuessing}
		{bonusGuessing}
		{bonusRevealing}
		{drag}
		onPlace={handlePlace}
	/>
</div>
