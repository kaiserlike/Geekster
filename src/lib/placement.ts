// Pure placement rules. `game.svelte.ts` owns the state; everything that decides
// whether a placement is right lives here, so it can be tested without runes.

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
