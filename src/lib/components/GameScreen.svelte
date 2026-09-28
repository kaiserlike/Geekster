<script lang="ts">
	import {
		getState,
		placeGame,
		advanceToNextGame,
		submitBonusGuess,
		skipBonusGuess
	} from '$lib/game.svelte';
	import type { RoundScore } from '$lib/types';
	import { ts, tf } from '$lib/i18n.svelte';
	import BonusGuessPanel from './BonusGuessPanel.svelte';
	import CurrentCard from './CurrentCard.svelte';
	import FeedbackToast from './FeedbackToast.svelte';
	import RunHud from './RunHud.svelte';
	import ScoreReveal from './ScoreReveal.svelte';
	import Timeline from './Timeline.svelte';
	import { DragPlace } from '$lib/dragPlace.svelte';
	import { runOutcome } from '$lib/placement';
	import { fly } from 'svelte/transition';

	let feedbackMessage: string | null = $state(null);
	let feedbackType: 'correct' | 'wrong' | 'life' | null = $state(null);
	let revealing: boolean = $state(false);
	let bonusGuessing: boolean = $state(false);
	let bonusRevealing: boolean = $state(false);
	let lastRoundScore: RoundScore | null = $state(null);
	let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

	const gameState = $derived(getState());
	const isLastRound = $derived(
		runOutcome(gameState.lives, gameState.remainingGames.length) !== null
	);

	const drag = new DragPlace({
		canDrag: () => !revealing && !bonusGuessing && gameState.currentGame !== null,
		onDrop: handlePlace
	});

	function handlePlace(slotIndex: number) {
		// Ensure drag state is clean
		drag.reset();

		placeGame(slotIndex);
		const s = getState();

		if (feedbackTimer) clearTimeout(feedbackTimer);

		if (s.lastPlacementCorrect) {
			feedbackMessage = s.lifeRegained
				? tf<(n: number) => string>('game.lifeRegained')(s.streak)
				: ts('game.correct');
			feedbackType = s.lifeRegained ? 'life' : 'correct';
			// Show bonus guess panel for correct placements only
			bonusGuessing = true;
		} else {
			const livesLeft = s.lives;
			feedbackMessage =
				livesLeft > 0
					? `${ts('game.wrong')} ${tf<(n: number) => string>('game.livesRemaining')(livesLeft)}`
					: `${ts('game.wrong')} ${ts('game.noLivesLeft')}`;
			feedbackType = 'wrong';
			// Skip bonus guess on wrong placement — go straight to reveal
			skipBonusGuess();
			showBonusResults();
		}

		feedbackTimer = setTimeout(() => {
			feedbackMessage = null;
			feedbackType = null;
		}, 5000);
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
		feedbackMessage = null;
		feedbackType = null;
		bonusRevealing = false;
		revealing = false;
		lastRoundScore = null;
		advanceToNextGame();
	}
</script>

<div class="flex min-h-screen flex-col px-4 py-6">
	<!-- Header -->
	<div class="mb-6 text-center">
		<h1
			class="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-2xl font-bold text-transparent"
		>
			Geekster
			{#if gameState.mode === 'pro'}
				<span
					class="ml-1 inline-block rounded-full bg-blue-900/60 px-2 py-0.5 align-middle text-xs font-bold tracking-wide text-blue-300 uppercase"
					data-run-mode="pro">{ts('mode.pro')}</span
				>
			{/if}
		</h1>
		<RunHud
			lives={gameState.lives}
			maxLives={gameState.maxLives}
			streak={gameState.streak}
			lifeRegained={gameState.lifeRegained}
			correctPlacements={gameState.correctPlacements}
			totalScore={gameState.totalScore}
		/>
	</div>

	<FeedbackToast message={feedbackMessage} type={feedbackType} />

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
