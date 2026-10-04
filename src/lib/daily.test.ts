import { describe, expect, it } from 'vitest';
import {
	addDays,
	DAILY_CARDS,
	dailyStreak,
	dayNumber,
	daysBetween,
	msUntilNextDaily,
	pickDaily,
	utcDay,
	type DatedId
} from './daily';

/** A seeded random (mulberry32), so a draw is repeatable */
function seeded(seed: number): () => number {
	let a = seed;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function pool(byDecade: Record<number, number>): DatedId[] {
	let id = 1;
	return Object.entries(byDecade).flatMap(([decade, count]) =>
		Array.from({ length: count }, (_v, i) => ({ id: id++, year: Number(decade) + (i % 10) }))
	);
}

describe('days', () => {
	it('takes the UTC day, not the local one', () => {
		expect(utcDay(new Date('2026-10-05T23:30:00Z'))).toBe('2026-10-05');
		// 00:30 in Vienna is still the day before in UTC
		expect(utcDay(new Date('2026-10-06T00:30:00+02:00'))).toBe('2026-10-05');
	});

	it('counts and adds days across a month', () => {
		expect(daysBetween('2026-09-29', '2026-10-02')).toBe(3);
		expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
		expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
	});

	it('numbers the Dailies from the first one', () => {
		expect(dayNumber(null, '2026-10-05')).toBe(1);
		expect(dayNumber('2026-10-05', '2026-10-05')).toBe(1);
		expect(dayNumber('2026-10-05', '2026-10-16')).toBe(12);
	});

	it('knows how long until midnight UTC', () => {
		expect(msUntilNextDaily(new Date('2026-10-05T18:00:00Z'))).toBe(6 * 3600 * 1000);
		expect(msUntilNextDaily(new Date('2026-10-05T00:00:00Z'))).toBe(24 * 3600 * 1000);
	});
});

describe('dailyStreak', () => {
	it('counts the days in a row up to today', () => {
		expect(dailyStreak(['2026-10-03', '2026-10-04', '2026-10-05'], '2026-10-05')).toBe(3);
	});

	it('keeps a streak alive until the day is over', () => {
		expect(dailyStreak(['2026-10-03', '2026-10-04'], '2026-10-05')).toBe(2);
	});

	it('breaks on a missed day', () => {
		expect(
			dailyStreak(['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05'], '2026-10-05')
		).toBe(2);
		expect(dailyStreak(['2026-10-02', '2026-10-03'], '2026-10-05')).toBe(0);
		expect(dailyStreak([], '2026-10-05')).toBe(0);
	});
});

describe('pickDaily', () => {
	const size = DAILY_CARDS + 1;

	it('picks the anchor and ten cards, all different', () => {
		const ids = pickDaily(pool({ 1980: 20, 1990: 20, 2000: 20, 2010: 20 }), new Set(), seeded(1));
		expect(ids).toHaveLength(size);
		expect(new Set(ids).size).toBe(size);
	});

	it('spreads over the decades instead of following the pool', () => {
		const games = pool({ 1980: 3, 1990: 3, 2000: 5, 2010: 60 });
		const decadeOf = new Map(games.map((g) => [g.id, Math.floor(g.year / 10) * 10]));
		for (let seed = 1; seed <= 20; seed++) {
			const ids = pickDaily(games, new Set(), seeded(seed))!;
			const decades = new Set(ids.map((id) => decadeOf.get(id)));
			expect(decades.size).toBe(4);
		}
	});

	it('leaves out recent games while the pool has enough without them', () => {
		const games = pool({ 1990: 15, 2000: 15 });
		const recent = new Set(games.slice(0, 19).map((g) => g.id));
		const ids = pickDaily(games, recent, seeded(3))!;
		expect(ids.every((id) => !recent.has(id))).toBe(true);
	});

	it('falls back to the whole pool when too few fresh games are left', () => {
		const games = pool({ 1990: 6, 2000: 6 });
		const ids = pickDaily(games, new Set(games.slice(0, 5).map((g) => g.id)), seeded(4));
		expect(ids).toHaveLength(size);
	});

	it('refuses a pool smaller than a Daily', () => {
		expect(pickDaily(pool({ 2000: size - 1 }), new Set())).toBeNull();
	});

	it('is the same draw for the same random', () => {
		const games = pool({ 1980: 10, 1990: 10, 2000: 10 });
		expect(pickDaily(games, new Set(), seeded(9))).toEqual(pickDaily(games, new Set(), seeded(9)));
	});
});
