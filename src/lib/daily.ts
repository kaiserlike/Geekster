// The Daily Run's pure rules (Sprint 10d), shared by the server and the welcome screen.
// Decisions of 2026-10-04: the day turns at midnight UTC (10d-1), so everyone plays the same
// Daily Run #N at the same moment; the set is drawn from the Normal pool, spread over the
// decades, and avoids the games of the last 30 Dailies (10d-2); one attempt per device.

/** Cards to place after the anchor */
export const DAILY_CARDS = 10;
/** A Daily's games stay out of the next draws for this many days */
export const DAILY_NO_REPEAT_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The UTC day of `now`, as `daily_challenges.date` stores it: `2026-10-05` */
export function utcDay(now: Date): string {
	return now.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD` */
export function daysBetween(from: string, to: string): number {
	return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** The day `days` after `day` */
export function addDays(day: string, days: number): string {
	return utcDay(new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS));
}

/** Daily Run #N: the first Daily is #1, and the number goes up by one every day after it */
export function dayNumber(firstDay: string | null, today: string): number {
	return firstDay === null ? 1 : Math.max(1, daysBetween(firstDay, today) + 1);
}

/** Milliseconds until the next Daily, at the next midnight UTC */
export function msUntilNextDaily(now: Date): number {
	const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
	return next - now.getTime();
}

/**
 * Days in a row with a Daily played, counted back from today, or from yesterday when today's
 * isn't played yet: a streak isn't lost before the day is over
 */
export function dailyStreak(playedDays: string[], today: string): number {
	const played = new Set(playedDays);
	let day = played.has(today) ? today : addDays(today, -1);
	let streak = 0;
	while (played.has(day)) {
		streak++;
		day = addDays(day, -1);
	}
	return streak;
}

export interface DatedId {
	id: number;
	year: number;
}

/** A shuffle driven by `random` (Fisher–Yates), so a test can pass a seeded one */
function shuffled<T>(items: T[], random: () => number): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/**
 * The day's set: the anchor and `DAILY_CARDS` cards, in play order. Drawn round-robin over the
 * decades in a random order, so ten 2010s games can't happen while older ones exist; the games
 * in `recent` are left out while the pool has enough without them. Null for a pool too small
 */
export function pickDaily(
	pool: DatedId[],
	recent: ReadonlySet<number>,
	random: () => number = Math.random
): number[] | null {
	const size = DAILY_CARDS + 1;
	if (pool.length < size) return null;
	const fresh = pool.filter((g) => !recent.has(g.id));
	const source = fresh.length >= size ? fresh : pool;

	const byDecade = new Map<number, DatedId[]>();
	for (const game of source) {
		const decade = Math.floor(game.year / 10) * 10;
		byDecade.set(decade, [...(byDecade.get(decade) ?? []), game]);
	}
	const queues = shuffled([...byDecade.values()], random).map((games) => shuffled(games, random));

	const picked: number[] = [];
	while (picked.length < size) {
		for (const queue of queues) {
			const game = queue.pop();
			if (game && picked.length < size) picked.push(game.id);
		}
	}
	// The round-robin order would put the decades in a pattern: the play order is shuffled again
	return shuffled(picked, random);
}

/** One square of the Daily HUD: a card placed right or missed, the card up now, or one to come */
export type DailyCell = 'hit' | 'miss' | 'current' | 'open';

export interface DailyProgress {
	/** The card the HUD names: the one up now, or the one just placed until the next is dealt */
	card: number;
	cells: DailyCell[];
}

/**
 * Where a Daily Run stands, for the HUD: one square per card, from the run's marks (`o` right,
 * `x` missed, in play order). Progress only ever grows — a miss turns its square red and nothing
 * empties, which is what the streak bar did and why players read it as their progress
 */
export function dailyProgress(marks: string, cardUp: boolean): DailyProgress {
	const placed = Math.min(marks.length, DAILY_CARDS);
	const cells = Array.from({ length: DAILY_CARDS }, (_v, i): DailyCell => {
		if (i < placed) return marks[i] === 'x' ? 'miss' : 'hit';
		return cardUp && i === placed ? 'current' : 'open';
	});
	const card = cardUp ? placed + 1 : placed;
	return { card: Math.min(Math.max(card, 1), DAILY_CARDS), cells };
}
