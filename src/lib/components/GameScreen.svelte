<script lang="ts">
	import {
		getLastPlacedGame,
		getState,
		placeGame,
		resetGame,
		advanceToNextGame,
		submitBonusGuess,
		skipBonusGuess
	} from '$lib/game.svelte';
	import { tick } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { PlacementVerdict, RoundScore, RoundStage } from '$lib/types';
	import { formatMultiplier, tf, tk, ts } from '$lib/i18n.svelte';
	import BonusGuessPanel from './BonusGuessPanel.svelte';
	import CoachMark from './CoachMark.svelte';
	import ConsolationResult from './ConsolationResult.svelte';
	import CurrentCard from './CurrentCard.svelte';
	import PlacementResult from './PlacementResult.svelte';
	import RunHud from './RunHud.svelte';
	import ScoreReveal from './ScoreReveal.svelte';
	import Timeline from './Timeline.svelte';
	import { DragPlace } from '$lib/dragPlace.svelte';
	import { hasSeenCoach, markCoachSeen } from '$lib/firstRun';
	import { headerScore } from '$lib/headerScore.svelte';
	import { ghostSlotIndex, hudMoment, runOutcome, streakMeter } from '$lib/placement';
	import { PLACEMENT_POINTS } from '$lib/scoring';
	import Button from './ui/Button.svelte';
	import { DURATION } from '$lib/motion';

	// A reveal ignores "Next card" this long, so the Enter that submitted the guess doesn't skip it
	const NEXT_GUARD_MS = 300;
	// How long a verdict stays on the card before it turns into the bonus round or the consolation
	const VERDICT_MS = 1000;
	// A request to the referee shows that it is under way only past this (10b-2): a normal round
	// trip (~80 ms) shows nothing, the input is locked from the start either way
	const SLOW_REQUEST_MS = 300;
	// A phone scrolls to the card first; the verdict waits for it, but never longer than this
	const SCROLL_WAIT_MS = 1200;

	// Where the round is: the card to place, the verdict on the card, the bonus guess (after a
	// miss the consolation, the name alone), the reveal (a miss's verdict pinned above it)
	let stage: RoundStage = $state('card');
	// What the placement did: shown on the card (PlacementResult), spoken by the live region
	let verdict: PlacementVerdict | null = $state(null);
	// The verdict is up: a phone first scrolls to the card, which still shows as it was
	let verdictShown: boolean = $state(false);
	let verdictTimer: ReturnType<typeof setTimeout> | null = null;
	let spoken: string = $state('');
	let lastRoundScore: RoundScore | null = $state(null);
	// A wrong placement: the slot the player chose, in the timeline that now holds the card. Set
	// at the reveal: until the consolation is answered the card's row is hidden
	let ghostAt: number | null = $state(null);
	let chosenSlot = 0;
	// The phone keyboard is up for the bonus guess: the HUD collapses into the header
	let keyboardOpen: boolean = $state(false);
	let revealedAt = 0;
	let timeline: ReturnType<typeof Timeline> | undefined = $state(undefined);
	let nextButton: HTMLButtonElement | null = $state(null);
	let stageHeight: number = $state(0);
	// The first-run coach mark, gone with the first placement. A run is never server-rendered,
	// so this reads localStorage on the client only
	let coach: boolean = $state(!hasSeenCoach());
	// A request has been under way longer than SLOW_REQUEST_MS
	let slow: boolean = $state(false);

	const gameState = $derived(getState());
	const isLastRound = $derived(runOutcome(gameState.lives, gameState.remaining) !== null);
	// Between a placement and the next card, the HUD marks what it did
	const moment = $derived(
		hudMoment(
			gameState.lastPlacedGameId !== null ? gameState.lastPlacementCorrect : null,
			gameState.streak,
			gameState.lifeRegained
		)
	);

	const drag = new DragPlace({
		canDrag: () => stage === 'card' && gameState.currentGame !== null && !gameState.pending,
		onDrop: handlePlace
	});

	function dismissCoach() {
		coach = false;
		markCoachSeen();
	}

	$effect(() => {
		if (!gameState.pending) return;
		const timer = setTimeout(() => (slow = true), SLOW_REQUEST_MS);
		return () => {
			clearTimeout(timer);
			slow = false;
		};
	});

	$effect(() => {
		headerScore.value = keyboardOpen ? gameState.totalScore : null;
		return () => (headerScore.value = null);
	});

	/** The words for the placement just made, from the HUD's moment */
	function placementVerdict(): PlacementVerdict {
		const s = getState();
		if (moment === 'wrong') {
			// The year only: the name is the consolation's question
			const placed = getLastPlacedGame();
			return {
				tone: 'wrong',
				title: ts('verdict.wrong'),
				detail: placed
					? tf<(year: number, livesLeft: number) => string>('verdict.wrongYear')(
							placed.year,
							s.lives
						)
					: undefined
			};
		}
		const inARow = tf<(n: number) => string>('verdict.inARow')(s.streak);
		switch (moment) {
			case 'lifeBack':
				return { tone: 'life', title: inARow, detail: ts('verdict.lifeBack') };
			case 'tenInARow':
				return {
					tone: 'streak',
					title: inARow,
					detail: tf<(m: string) => string>('verdict.livesFull')(
						formatMultiplier(streakMeter(s.streak, s.lives, s.maxLives).multiplier)
					)
				};
			default:
				return {
					tone: 'correct',
					title: ts('verdict.correct'),
					detail: tf<(points: number, streak: number) => string>('verdict.correctDetail')(
						PLACEMENT_POINTS,
						s.streak
					)
				};
		}
	}

	/** A miss, once its consolation is scored: the answer. A known name gets its own strip */
	function missVerdict(round: RoundScore): PlacementVerdict {
		return {
			tone: 'wrong',
			title: ts('verdict.wrong'),
			detail: tf<(name: string, year: number, livesLeft: number) => string>('verdict.wrongDetail')(
				round.actualName,
				round.actualYear,
				getState().lives
			)
		};
	}

	/** What the live region says about a consolation that paid */
	function consolationSpoken(round: RoundScore): string | null {
		if (round.nameBonus <= 0) return null;
		return `${ts('consolation.title')} · +${round.nameBonus} ${ts('hud.creditsShort')}`;
	}

	function handlePlace(slotIndex: number) {
		// Ensure drag state is clean
		drag.reset();
		if (stage !== 'card') return;
		placeGame(slotIndex, () => showPlacement(slotIndex));
	}

	/** The referee's verdict is in: the card turns into it (in the same tick as the state change) */
	function showPlacement(slotIndex: number) {
		if (coach) dismissCoach();
		verdict = placementVerdict();
		spoken = [verdict.title, verdict.detail].filter(Boolean).join(' · ');
		verdictShown = false;
		chosenSlot = slotIndex;

		stage = 'verdict';
		// The card turns into its verdict, then into the bonus round — or, after a miss, the
		// consolation. It is at the top: the only scroll here, and it gives nothing away. The
		// verdict waits until the card is in view
		window.scrollTo({ top: 0, behavior: scrollBehavior() });
		whenAtTop().then(() => {
			if (stage !== 'verdict') return;
			verdictShown = true;
			verdictTimer = setTimeout(startBonusRound, VERDICT_MS);
		});
	}

	/** The verdict is over (or tapped away): the card becomes the bonus round or the consolation */
	function startBonusRound() {
		if (verdictTimer) clearTimeout(verdictTimer);
		verdictTimer = null;
		if (stage !== 'verdict') return;
		stage = 'bonus';
	}

	/** Resolves once the page is at its top (a smooth scroll has arrived), or after a while */
	function whenAtTop(): Promise<void> {
		return new Promise((resolve) => {
			const start = performance.now();
			const check = () => {
				if (window.scrollY < 2 || performance.now() - start > SCROLL_WAIT_MS) resolve();
				else requestAnimationFrame(check);
			};
			check();
		});
	}

	$effect(() => () => {
		if (verdictTimer) clearTimeout(verdictTimer);
	});

	function handleBonusSubmit(yearGuess: number | null, nameGuess: string | null) {
		submitBonusGuess({ yearGuess, nameGuess }, showBonusResults);
	}

	function handleBonusSkip() {
		skipBonusGuess(showBonusResults);
	}

	async function showBonusResults() {
		keyboardOpen = false;
		const s = getState();
		lastRoundScore = s.roundScores[s.roundScores.length - 1] ?? null;
		if (!s.lastPlacementCorrect && lastRoundScore) {
			// The miss's answer is out: pinned as one line, with a ghost where the player put it (U8)
			verdict = missVerdict(lastRoundScore);
			spoken = [verdict.title, verdict.detail, consolationSpoken(lastRoundScore)]
				.filter(Boolean)
				.join(' · ');
			const insertedAt = s.timeline.findIndex((g) => g.id === s.lastPlacedGameId);
			ghostAt = ghostSlotIndex(chosenSlot, insertedAt);
		}
		stage = 'reveal';
		revealedAt = performance.now();
		await tick();
		// The one scroll a reveal is allowed: to the answer card at the top, or on a miss to the
		// ghost and the card
		if (s.lastPlacementCorrect) {
			window.scrollTo({ top: 0, behavior: scrollBehavior() });
		} else {
			// The stage glides from the card's height to nothing first; measured before that, the
			// ghost and the card would end up under the pinned verdict
			await new Promise((r) => setTimeout(r, prefersReducedMotion.current ? 0 : DURATION.slow));
			timeline?.revealInView();
		}
	}

	// "Next card" answers Enter (and Space, as a focused button does) from the moment it is there:
	// at once on a miss, after the breakdown on a correct placement
	$effect(() => {
		if (stage === 'reveal' && nextButton) nextButton.focus({ preventScroll: true });
	});

	function handleNextGame() {
		// The Enter that submitted the guess must not also skip the reveal
		if (performance.now() - revealedAt < NEXT_GUARD_MS) return;
		advanceToNextGame(() => {
			verdict = null;
			verdictShown = false;
			stage = 'card';
			lastRoundScore = null;
			ghostAt = null;
			// The next card is at the top
			window.scrollTo({ top: 0, behavior: 'instant' });
		});
	}

	function scrollBehavior(): 'instant' | 'smooth' {
		return prefersReducedMotion.current ? 'instant' : 'smooth';
	}
</script>

{#snippet nextCard()}
	<Button bind:ref={nextButton} variant="primary" fullWidth loading={slow} onclick={handleNextGame}>
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
		card={gameState.currentGame ? gameState.timeline.length + 1 : gameState.timeline.length}
		daily={gameState.daily
			? { marks: gameState.marks, cardUp: gameState.currentGame !== null }
			: null}
	/>
{/snippet}

<!--
	One column on every screen (user decision, 2026-09-28): the card on top, the timeline under
	it, dragged top to bottom. A desktop gets it larger, within 880 px. Once the card scrolls off,
	a bar pinned to the top carries the compact HUD and the card's strip
-->
<div class="max-w-run mx-auto flex w-full flex-col gap-3 px-4 pt-2 pb-6">
	<h1 class="sr-only" tabindex="-1">{ts('game.heading')}</h1>
	{#if !keyboardOpen}
		{@render hud(drag.isDragging)}
	{/if}

	{#if gameState.runError}
		<!-- A request to the referee failed: retry the same move, or, if the run is lost, leave it -->
		<div
			role="alert"
			class="rounded-control border-danger bg-surface-raised text-ink flex flex-wrap items-center gap-3 border-[1.5px] px-3.5 py-2.5 text-sm"
		>
			<p class="m-0 grow">{tk(gameState.runError)}</p>
			{#if gameState.runError === 'error.runLost'}
				<Button variant="secondary" size="sm" onclick={resetGame}>{ts('result.mainMenu')}</Button>
			{/if}
		</div>
	{/if}

	<!-- The verdict is spoken here; on screen it is the card itself (PlacementResult) -->
	<p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{spoken}</p>

	{#if stage === 'reveal' && verdict?.tone === 'wrong'}
		{@const placed = getLastPlacedGame()}
		<!-- A miss: the verdict as one line, pinned while the page scrolls to the ghost; a known
		     name as a second, turquoise one under it -->
		<div class="sticky top-2 z-30 flex flex-col gap-1.5" data-verdict-strip>
			<PlacementResult
				screenshot={placed?.screenshot ?? ''}
				message={verdict}
				shown={verdictShown}
				compact
			/>
			{#if lastRoundScore && lastRoundScore.nameBonus > 0}
				<ConsolationResult name={lastRoundScore.actualName} points={lastRoundScore.nameBonus} />
			{/if}
		</div>
	{/if}

	<!--
		The stage: the card to place, its verdict, the bonus round, the answer, one at a time in the
		same place. Its height glides between them, and the one leaving fades over the one arriving
	-->
	<div
		class="transition-[height] duration-(--duration-slow) ease-(--ease-out) motion-reduce:transition-none"
		style:height={stageHeight ? `${stageHeight}px` : undefined}
	>
		<div bind:clientHeight={stageHeight} class="grid *:col-start-1 *:row-start-1">
			{#if gameState.currentGame}
				<CurrentCard
					game={gameState.currentGame}
					cardNumber={gameState.daily ? gameState.marks.length + 1 : gameState.timeline.length + 1}
					busy={slow}
					{drag}
				>
					{#snippet pinnedHud()}
						{@render hud(true)}
					{/snippet}
				</CurrentCard>
			{:else if stage === 'verdict' && verdict}
				{@const placed = getLastPlacedGame()}
				<PlacementResult
					screenshot={placed?.screenshot ?? ''}
					message={verdict}
					shown={verdictShown}
					onskip={startBonusRound}
				/>
			{:else if stage === 'bonus'}
				<BonusGuessPanel
					consolation={gameState.lastPlacementCorrect === false}
					busy={gameState.pending}
					{slow}
					onSubmit={handleBonusSubmit}
					onSkip={handleBonusSkip}
					onKeyboard={(open) => (keyboardOpen = open)}
				/>
			{:else if stage === 'reveal' && lastRoundScore && gameState.lastPlacementCorrect}
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
	</div>

	{#if coach && gameState.currentGame && gameState.timeline.length === 1}
		<CoachMark anchor={gameState.timeline[0]} ondismiss={dismissCoach} />
	{/if}

	<div class="mt-3">
		<Timeline
			bind:this={timeline}
			timeline={gameState.timeline}
			lastPlacedGameId={gameState.lastPlacedGameId}
			showSlots={gameState.currentGame !== null}
			{stage}
			misplaced={gameState.lastPlacementCorrect === false}
			{ghostAt}
			{drag}
			onPlace={handlePlace}
		/>
	</div>

	{#if stage === 'reveal' && gameState.lastPlacementCorrect === false}
		<!-- A miss: pinned to the bottom, wherever the reveal scrolled to (the ghost may be far down) -->
		<div class="bg-bg sticky bottom-0 -mx-4 px-4 py-3">
			{@render nextCard()}
		</div>
	{/if}
</div>
