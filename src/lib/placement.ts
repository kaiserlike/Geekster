// Pure placement rules. `game.svelte.ts` owns the state; everything that decides
// whether a placement is right lives here, so it can be tested without runes.

import { getStreakMultiplier } from './scoring';

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

/** What the streak bar shows (Sprint 9c, decision 5: the bar is the streak). */
export interface StreakMeterState {
	/** Lit segments, 0–10: a full bar at 10, 20 …, one lit again at 11 */
	filled: number;
	/** The multiplier the next correct placement earns (a round is scored with the streak after it) */
	multiplier: number;
	/** The heart socket at the bar's end: only while a life is missing */
	socket: boolean;
	/** Correct placements in a row still needed for a life, or null with lives full */
	toNextLife: number | null;
}

export function streakMeter(streak: number, lives: number, maxLives: number): StreakMeterState {
	const socket = lives < maxLives;
	return {
		filled: streak === 0 ? 0 : ((streak - 1) % LIFE_REGAIN_STREAK) + 1,
		multiplier: getStreakMultiplier(streak + 1),
		socket,
		toNextLife: socket ? LIFE_REGAIN_STREAK - (streak % LIFE_REGAIN_STREAK) : null
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

/** One decade of the timeline, for the decade ruler and the pinned labels (Sprint 9d). */
export interface DecadeBucket {
	/** The decade's first year: 1990 for the 1990s */
	decade: number;
	/** Cards the timeline holds from that decade */
	count: number;
	/** Index in the timeline of its first card */
	firstIndex: number;
}

/**
 * The decades a timeline holds, oldest first. The timeline is sorted by year, so each decade is
 * one run of cards; a decade with no card has no bucket.
 */
export function decadeBuckets(timeline: Dated[]): DecadeBucket[] {
	const buckets: DecadeBucket[] = [];
	timeline.forEach((game, index) => {
		const decade = Math.floor(game.year / 10) * 10;
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
