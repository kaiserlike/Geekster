// The admin's cover functions (12c) against an in-memory database with the real migrations.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { games } from './schema';
import { db, freshDb, seedGames } from './testDb';
import { deleteGame, listGames, removeGameCover, setGameCover } from './games';

vi.mock('./db', () => import('./testDb'));

const KEY_ART = 'https://media.rawg.io/media/games/abc/key-art.jpg';

let gameId: number;

beforeEach(async () => {
	await freshDb();
	const seeded = await seedGames([{ name: 'Half-Life', year: 1998 }]);
	gameId = [...seeded.keys()][0];
});

async function coverOf(id: number) {
	const [row] = await db
		.select({ url: games.coverUrl, source: games.coverSourceUrl, slug: games.rawgSlug })
		.from(games)
		.where(eq(games.id, id));
	return row;
}

describe('setGameCover', () => {
	it('stores the cover, its source and the RAWG slug', async () => {
		const previous = await setGameCover(gameId, {
			url: 'https://blob.test/a.webp',
			sourceUrl: KEY_ART,
			rawgSlug: 'half-life'
		});
		expect(previous).toBeNull();
		expect(await coverOf(gameId)).toEqual({
			url: 'https://blob.test/a.webp',
			source: KEY_ART,
			slug: 'half-life'
		});
	});

	it('hands back the replaced cover for its blob to be deleted', async () => {
		await setGameCover(gameId, {
			url: 'https://blob.test/a.webp',
			sourceUrl: null,
			rawgSlug: null
		});
		const previous = await setGameCover(gameId, {
			url: 'https://blob.test/b.webp',
			sourceUrl: null,
			rawgSlug: null
		});
		expect(previous).toBe('https://blob.test/a.webp');
	});

	it('keeps the RAWG slug when a file replaces a RAWG cover', async () => {
		await setGameCover(gameId, {
			url: 'https://blob.test/a.webp',
			sourceUrl: KEY_ART,
			rawgSlug: 'half-life'
		});
		await setGameCover(gameId, {
			url: 'https://blob.test/b.webp',
			sourceUrl: null,
			rawgSlug: null
		});
		expect(await coverOf(gameId)).toEqual({
			url: 'https://blob.test/b.webp',
			source: null,
			slug: 'half-life'
		});
	});
});

describe('removeGameCover', () => {
	it('clears the cover, keeps the slug and hands back the URL', async () => {
		await setGameCover(gameId, {
			url: 'https://blob.test/a.webp',
			sourceUrl: KEY_ART,
			rawgSlug: 'half-life'
		});
		expect(await removeGameCover(gameId)).toBe('https://blob.test/a.webp');
		expect(await coverOf(gameId)).toEqual({ url: null, source: null, slug: 'half-life' });
	});

	it('hands back nothing when there was no cover', async () => {
		expect(await removeGameCover(gameId)).toBeNull();
	});
});

describe('deleteGame', () => {
	it("hands back the cover's URL with the screenshots', so no blob is orphaned", async () => {
		await setGameCover(gameId, {
			url: 'https://blob.test/a.webp',
			sourceUrl: null,
			rawgSlug: null
		});
		const urls = await deleteGame(gameId);
		expect(urls).toContain('https://blob.test/a.webp');
		expect(urls).toContain('https://blob.test/half-life-normal.webp');
	});
});

describe('the list', () => {
	it('filters the games without a cover', async () => {
		await seedGames([{ name: 'Doom', year: 1993, cover: 'https://blob.test/doom.webp' }]);
		const without = await listGames({ missing: 'cover' });
		expect(without.map((game) => game.name)).toEqual(['Half-Life']);
	});
});
