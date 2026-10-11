import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, freshDb, seedGames } from './testDb';
import { liveGamesPerYear } from './encyclopedia';

vi.mock('./db', () => import('./testDb'));

beforeEach(async () => {
	await freshDb();
});

describe('liveGamesPerYear', () => {
	it('counts the live games of each asked year', async () => {
		await seedGames([
			{ name: 'A', year: 1998 },
			{ name: 'B', year: 1998 },
			{ name: 'C', year: 1999 },
			{ name: 'D', year: 2001 }
		]);
		const counts = await liveGamesPerYear(db, [1998, 1999]);
		expect(Object.fromEntries(counts)).toEqual({ 1998: 2, 1999: 1 });
	});

	it('counts a game live only in Pro, and a game in both tiers once', async () => {
		await seedGames([
			{ name: 'Pro only', year: 1995, tiers: ['pro'] },
			{ name: 'Both', year: 1995, tiers: ['normal', 'pro'] }
		]);
		expect((await liveGamesPerYear(db, [1995])).get(1995)).toBe(2);
	});

	it('leaves out drafts and games without a primary screenshot', async () => {
		await seedGames([
			{ name: 'Draft', year: 1996, published: false },
			{ name: 'No shot', year: 1996, tiers: [] }
		]);
		expect((await liveGamesPerYear(db, [1996])).has(1996)).toBe(false);
	});

	it('asks nothing for no years', async () => {
		await seedGames([{ name: 'A', year: 1998 }]);
		expect((await liveGamesPerYear(db, [])).size).toBe(0);
	});
});
