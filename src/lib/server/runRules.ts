// The referee's rules, pure (Sprint 10b). `runs.ts` reads a run, asks these what a request
// does to it, and writes the answer back conditionally. Nothing here touches the database, so
// every state transition is unit-tested. The game's own rules are imported, never copied: a
// rule that has to change changes in `placement.ts` or `scoring.ts`.

import {
	applyPlacement,
	findCorrectIndex,
	isPlacementCorrect,
	MAX_LIVES,
	runOutcome,
	type RunEnd
} from '$lib/placement';
import { calculateRoundScore } from '$lib/scoring';
import type { Difficulty } from '$lib/screenshotTiers';
import type { BonusGuess, RoundScore } from '$lib/types';

/** The bonus guess's time limit, as the client counts it (`BonusGuessPanel`) */
export const BONUS_SECONDS = 30;

/**
 * What the server allows on top of the 30 s: the correct verdict stays on the card for a second
 * (a phone scrolls to it first, up to 1.2 s), then the panel counts down, then the guess travels.
 * The client's countdown is the display; this deadline is the judge.
 */
export const BONUS_SLACK_MS = 5000;

/** The longest name guess that is scored; anything longer is cut */
export const MAX_NAME_GUESS = 100;

/**
 * Where a run is between requests:
 * - `placing`: a card is out, waiting for a slot
 * - `bonus`: placed correctly, the bonus window is open
 * - `revealed`: the round is scored and the card's name and year are out; waiting for "next"
 * - `over`: the run has ended and its score is written
 */
export type RunStage = 'placing' | 'bonus' | 'revealed' | 'over';

/** The part of a `runs` row the rules read and change */
export interface RunRecord {
	mode: Difficulty;
	/** The run's order; index 0 is the anchor */
	gameIds: number[];
	position: number;
	stage: RunStage;
	lives: number;
	streak: number;
	bestStreak: number;
	livesWonBack: number;
	totalScore: number;
	correct: number;
	wrong: number;
	bonusDeadline: number | null;
}

/** The card in play and the timeline it is placed into, from the database */
export interface DatedGame {
	id: number;
	name: string;
	year: number;
}

/** A request the run's state cannot take: the client answers it with the run lost or retried */
export class RunConflict extends Error {}

/** A new run over a shuffled pool of game ids */
export function newRun(mode: Difficulty, gameIds: number[]): RunRecord {
	return {
		mode,
		gameIds,
		position: 1,
		stage: 'placing',
		lives: MAX_LIVES,
		streak: 0,
		bestStreak: 0,
		livesWonBack: 0,
		totalScore: 0,
		correct: 0,
		wrong: 0,
		bonusDeadline: null
	};
}

/** Cards still to come after the one at `position` */
export function remainingAfter(run: Pick<RunRecord, 'gameIds' | 'position'>): number {
	return Math.max(0, run.gameIds.length - 1 - run.position);
}

/**
 * The years of the timeline the card at `position` is placed into: every card before it, in
 * year order. The client's timeline is always sorted by year (a correct placement fits between
 * its neighbours, a wrong one is inserted where it belongs), so its slot indices mean the same
 * here. Equal years may sit in another order on the client; their years read the same.
 */
export function timelineYears(placed: Pick<DatedGame, 'year'>[]): number[] {
	return placed.map((g) => g.year).sort((a, b) => a - b);
}

/** A request must name the card it is about: a retried or stale one is refused, never applied to the next */
export function expectStage(run: RunRecord, stage: RunStage, position: number): void {
	if (run.stage !== stage || run.position !== position) {
		throw new RunConflict(
			`expected ${stage} at ${position}, run is ${run.stage} at ${run.position}`
		);
	}
}

export interface PlaceOutcome {
	run: RunRecord;
	correct: boolean;
	/** Where the card goes in the client's timeline */
	insertAt: number;
	lifeRegained: boolean;
	/** A miss is scored (zero) and revealed at once; there is no bonus round */
	roundScore: RoundScore | null;
}

/** Places the card at `position` into `slot` of the timeline before it */
export function place(
	run: RunRecord,
	position: number,
	slot: number,
	timeline: number[],
	card: DatedGame,
	now: number
): PlaceOutcome {
	expectStage(run, 'placing', position);
	if (!Number.isInteger(slot) || slot < 0 || slot > timeline.length) {
		throw new RangeError(`slot ${slot} is outside a timeline of ${timeline.length}`);
	}

	const asDated = timeline.map((year) => ({ year }));
	const correct = isPlacementCorrect(asDated, card.year, slot);
	const insertAt = correct ? slot : findCorrectIndex(asDated, card.year);
	const { lives, streak, bestStreak, livesWonBack, lifeRegained } = applyPlacement(
		{
			lives: run.lives,
			maxLives: MAX_LIVES,
			streak: run.streak,
			bestStreak: run.bestStreak,
			livesWonBack: run.livesWonBack
		},
		correct
	);
	const next: RunRecord = {
		...run,
		lives,
		streak,
		bestStreak,
		livesWonBack,
		correct: run.correct + (correct ? 1 : 0),
		wrong: run.wrong + (correct ? 0 : 1),
		stage: correct ? 'bonus' : 'revealed',
		bonusDeadline: correct ? now + BONUS_SECONDS * 1000 + BONUS_SLACK_MS : null
	};

	if (correct) return { run: next, correct, insertAt, lifeRegained, roundScore: null };

	// A miss scores nothing, but it is a round: the client keeps one breakdown per card
	const roundScore = calculateRoundScore(
		false,
		{ yearGuess: null, nameGuess: null },
		card.year,
		card.name,
		next.streak,
		run.mode
	);
	return { run: next, correct, insertAt, lifeRegained, roundScore };
}

/** A guess as it arrives: anything that is not a plausible year or a string is no guess */
export function parseGuess(body: { yearGuess?: unknown; nameGuess?: unknown }): BonusGuess {
	const { yearGuess, nameGuess } = body;
	const year =
		typeof yearGuess === 'number' &&
		Number.isInteger(yearGuess) &&
		yearGuess >= 0 &&
		yearGuess <= 9999
			? yearGuess
			: null;
	const name =
		typeof nameGuess === 'string' && nameGuess.trim() !== ''
			? nameGuess.trim().slice(0, MAX_NAME_GUESS)
			: null;
	return { yearGuess: year, nameGuess: name };
}

export interface BonusOutcome {
	run: RunRecord;
	roundScore: RoundScore;
	/** The guess came after the deadline and was scored as skipped */
	late: boolean;
}

/** Scores the bonus guess for the card at `position` — or, past the window, scores it as skipped */
export function scoreBonus(
	run: RunRecord,
	position: number,
	guess: BonusGuess,
	card: DatedGame,
	now: number
): BonusOutcome {
	expectStage(run, 'bonus', position);
	const late = run.bonusDeadline === null || now > run.bonusDeadline;
	const counted: BonusGuess = late ? { yearGuess: null, nameGuess: null } : guess;
	// Scored with the streak after the placement, as the client always did
	const roundScore = calculateRoundScore(true, counted, card.year, card.name, run.streak, run.mode);
	return {
		run: {
			...run,
			stage: 'revealed',
			bonusDeadline: null,
			totalScore: run.totalScore + roundScore.total
		},
		roundScore,
		late
	};
}

export type AdvanceOutcome =
	| { run: RunRecord; over: false }
	| { run: RunRecord; over: true; endReason: RunEnd };

/** After a revealed round: the next card, or the end of the run */
export function advance(run: RunRecord, position: number): AdvanceOutcome {
	expectStage(run, 'revealed', position);
	const endReason = runOutcome(run.lives, remainingAfter(run));
	if (endReason) return { run: { ...run, stage: 'over' }, over: true, endReason };
	return { run: { ...run, stage: 'placing', position: run.position + 1 }, over: false };
}
