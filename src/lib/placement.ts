// Pure placement rules. `game.svelte.ts` owns the state; everything that decides
// whether a placement is right lives here, so it can be tested without runes.

import { getStreakMultiplier, MAX_STREAK_MULTIPLIER, STREAK_MULTIPLIER_STEP } from './scoring';

/** Anything with a release year — a `Game`, or a bare `{ year }` in a test. */
interface Dated {
	year: number;
}

/**
 * A slot is correct when the year fits between its neighbours. Equal years are
 * always correct, on either side: two games from the same year have no order.
 */
export function isPlacementCorrect(timeline: Dated[], year: number, slotIndex: number): boolean {
	if (slotIndex > 0 && year < timeline[slotIndex - 1].year) return false;
	if (slotIndex < timeline.length && year > timeline[slotIndex].year) return false;
	return true;
}

/** Where a wrongly placed game is auto-inserted: before the first game of the same year or later. */
export function findCorrectIndex(timeline: Dated[], year: number): number {
	const index = timeline.findIndex((game) => year <= game.year);
	return index === -1 ? timeline.length : index;
}

/** Lives at the start of a run, and the most a streak can bring back to. */
export const MAX_LIVES = 3;

/** Every streak of this length gives one life back, up to the maximum. */
export const LIFE_REGAIN_STREAK = 10;

/** True when the streak just reached a multiple of `LIFE_REGAIN_STREAK` and a life is missing. */
export function regainsLife(streak: number, lives: number, maxLives: number): boolean {
	return streak > 0 && streak % LIFE_REGAIN_STREAK === 0 && lives < maxLives;
}

export type RunEnd = 'outOfLives' | 'poolCleared';

/**
 * How a solo run ends, or null while it goes on. A run is endless: only the last
 * life or an empty pool ends it — never a number of placements. Losing the last
 * life on the last card is still out of lives.
 */
export function runOutcome(lives: number, remainingGames: number): RunEnd | null {
	if (lives <= 0) return 'outOfLives';
	if (remainingGames <= 0) return 'poolCleared';
	return null;
}

/** Perfect means every game in the pool placed, and none of them wrong. */
export function isPerfectRun(endReason: RunEnd | null, wrongPlacements: number): boolean {
	return endReason === 'poolCleared' && wrongPlacements === 0;
}

/** The part of a run that one placement changes. */
export interface RunCounters {
	lives: number;
	maxLives: number;
	streak: number;
	bestStreak: number;
	livesWonBack: number;
}

/**
 * The counters after one placement. A correct one extends the streak first and
 * then checks for a life back, so the 10th card in a row is the one that regains;
 * a wrong one costs a life and resets the streak.
 */
export function applyPlacement(
	run: RunCounters,
	correct: boolean
): RunCounters & { lifeRegained: boolean } {
	if (!correct) {
		return { ...run, lives: run.lives - 1, streak: 0, lifeRegained: false };
	}
	const streak = run.streak + 1;
	const lifeRegained = regainsLife(streak, run.lives, run.maxLives);
	return {
		...run,
		streak,
		bestStreak: Math.max(run.bestStreak, streak),
		lives: lifeRegained ? run.lives + 1 : run.lives,
		livesWonBack: lifeRegained ? run.livesWonBack + 1 : run.livesWonBack,
		lifeRegained
	};
}

/** One step of the HUD's multiplier ladder: ×1.0, ×1.1 … ×1.5 */
export interface LadderStep {
	value: number;
	/** At or below the multiplier the next correct card earns */
	lit: boolean;
	/** The multiplier the next correct card earns */
	current: boolean;
}

/**
 * What the endless HUD shows (2026-10-09, design 2D): the streak drives two separate things, so
 * they are drawn apart — the multiplier as a labelled ladder, and the way to a life back as the
 * empty heart filling up. The 10-segment streak bar this replaced was read as "cards placed".
 */
export interface StreakMeterState {
	/** The multiplier the next correct placement earns (a round is scored with the streak after it) */
	multiplier: number;
	steps: LadderStep[];
	/** Cards in a row towards the next life, 0–9, or null with lives full (nothing to charge) */
	charge: number | null;
	/** Correct placements in a row still needed for a life, or null with lives full */
	toNextLife: number | null;
}

const LADDER_STEPS = Math.round((MAX_STREAK_MULTIPLIER - 1) / STREAK_MULTIPLIER_STEP) + 1;
// Multipliers are sums of 0.1s; compare them at a tolerance, not exactly
const SAME_MULTIPLIER = 1e-9;

export function streakMeter(streak: number, lives: number, maxLives: number): StreakMeterState {
	const multiplier = getStreakMultiplier(streak + 1);
	const steps = Array.from({ length: LADDER_STEPS }, (_v, i): LadderStep => {
		const value = Math.round((1 + i * STREAK_MULTIPLIER_STEP) * 10) / 10;
		return {
			value,
			lit: value <= multiplier + SAME_MULTIPLIER,
			current: Math.abs(value - multiplier) < SAME_MULTIPLIER
		};
	});
	const charge = lives < maxLives ? streak % LIFE_REGAIN_STREAK : null;
	return {
		multiplier,
		steps,
		charge,
		toNextLife: charge === null ? null : LIFE_REGAIN_STREAK - charge
	};
}

/**
 * The moment the HUD marks between a placement and the next card: a wrong one (red frame, a
 * broken heart), a life won back (pink frame), or ten in a row with lives already full.
 * `placementCorrect` is null while no placement is on show (a new card is up).
 */
export type HudMoment = 'none' | 'wrong' | 'lifeBack' | 'tenInARow';

export function hudMoment(
	placementCorrect: boolean | null,
	streak: number,
	lifeRegained: boolean
): HudMoment {
	if (placementCorrect === null) return 'none';
	if (!placementCorrect) return 'wrong';
	if (lifeRegained) return 'lifeBack';
	if (streak > 0 && streak % LIFE_REGAIN_STREAK === 0) return 'tenInARow';
	return 'none';
}

/** One decade of the timeline, for the decade ruler (Sprint 9d; the timeline's decade labels were removed 2026-10-02). */
export interface DecadeBucket {
	/** The decade's first year: 1990 for the 1990s */
	decade: number;
	/** Cards the timeline holds from that decade */
	count: number;
	/** Index in the timeline of its first card */
	firstIndex: number;
}

/**
 * Each row's decade, as the timeline may show it. A card whose year is still the bonus question
 * (`hiddenIndex`) takes its neighbour's decade — the one before it, or after it when it is first —
 * so the ruler never narrows its year down beyond the slot it was put in.
 */
export function rowDecades(timeline: Dated[], hiddenIndex = -1): number[] {
	const decadeOf = (i: number) => Math.floor(timeline[i].year / 10) * 10;
	return timeline.map((_game, index) => {
		if (index !== hiddenIndex) return decadeOf(index);
		if (index > 0) return decadeOf(index - 1);
		return index + 1 < timeline.length ? decadeOf(index + 1) : decadeOf(index);
	});
}

/**
 * The decades a timeline holds, oldest first. The timeline is sorted by year, so each decade is
 * one run of cards; a decade with no card has no bucket. A hidden card counts in its
 * neighbour's decade (`rowDecades`).
 */
export function decadeBuckets(timeline: Dated[], hiddenIndex = -1): DecadeBucket[] {
	const buckets: DecadeBucket[] = [];
	rowDecades(timeline, hiddenIndex).forEach((decade, index) => {
		const last = buckets[buckets.length - 1];
		if (last && last.decade === decade) last.count++;
		else buckets.push({ decade, count: 1, firstIndex: index });
	});
	return buckets;
}

/**
 * Where the "You put it here" ghost goes after a wrong placement (U8), as a slot index of the
 * timeline that now holds the card. The player chose `chosenSlot` in the timeline before it;
 * the card was inserted at `insertedAt`. Slots past the insertion point moved down by one.
 */
export function ghostSlotIndex(chosenSlot: number, insertedAt: number): number {
	return chosenSlot <= insertedAt ? chosenSlot : chosenSlot + 1;
}
