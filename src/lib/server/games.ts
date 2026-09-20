import { and, asc, desc, eq, isNull, like, sql } from 'drizzle-orm';
import { db } from './db';
import { games, screenshots } from './schema';
import type { GameListQuery, GameSort, SortDirection } from '$lib/adminList';
import type {
	AdminGame,
	AdminGameDetail,
	AdminGameNeighbours,
	AdminScreenshot,
	Difficulty
} from '$lib/types';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

/** Turns a game name into the slug that also names its blob file. */
export function slugify(name: string): string {
	return name
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

/** Appends -2, -3, … until the slug is free. `exceptId` keeps a game's own slug. */
export async function uniqueSlug(base: string, exceptId?: number): Promise<string> {
	const root = base || 'game';
	let candidate = root;
	let suffix = 1;

	for (;;) {
		const taken = await db
			.select({ id: games.id })
			.from(games)
			.where(eq(games.slug, candidate))
			.limit(1);

		if (taken.length === 0 || taken[0].id === exceptId) return candidate;
		suffix++;
		candidate = `${root}-${suffix}`;
	}
}

function listOrder(sort: GameSort, direction: SortDirection) {
	const column = sort === 'name' ? games.name : sort === 'created' ? games.id : games.year;
	return direction === 'desc' ? desc(column) : asc(column);
}

function listFilter({ search = '', onlyMissing = false, status = 'all' }: Partial<GameListQuery>) {
	const conditions = [];
	if (search.trim()) conditions.push(like(games.name, `%${search.trim()}%`));
	// A game always has a primary once it has any screenshot, so a null join
	// result is exactly "no screenshots at all".
	if (onlyMissing) conditions.push(isNull(screenshots.url));
	if (status === 'draft') conditions.push(eq(games.published, 0));
	if (status === 'published') conditions.push(eq(games.published, 1));
	return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listGames(query: Partial<GameListQuery> = {}): Promise<AdminGame[]> {
	const { sort = 'year', direction = 'asc' } = query;

	const rows = await db
		.select({
			id: games.id,
			name: games.name,
			slug: games.slug,
			year: games.year,
			published: games.published,
			createdAt: games.createdAt,
			screenshot: screenshots.url,
			screenshotCount: sql<number>`(SELECT COUNT(*) FROM screenshots WHERE screenshots.game_id = ${games.id})`
		})
		.from(games)
		.leftJoin(screenshots, and(eq(screenshots.gameId, games.id), eq(screenshots.isPrimary, 1)))
		.where(listFilter(query))
		.orderBy(listOrder(sort, direction), asc(games.id));

	return rows.map((row) => ({
		...row,
		published: row.published === 1,
		screenshotCount: Number(row.screenshotCount)
	}));
}

/** How many games the game can never show, whatever the list is filtered to. */
export async function countGamesWithoutScreenshot(): Promise<number> {
	const [row] = await db
		.select({ total: sql<number>`COUNT(*)` })
		.from(games)
		.leftJoin(screenshots, and(eq(screenshots.gameId, games.id), eq(screenshots.isPrimary, 1)))
		.where(isNull(screenshots.url));

	return Number(row?.total ?? 0);
}

/**
 * The games either side of `id` in the list's own order, so the detail page can
 * step through the same set the operator was just looking at.
 */
export async function getGameNeighbours(
	id: number,
	query: Partial<GameListQuery> = {}
): Promise<AdminGameNeighbours> {
	const { sort = 'year', direction = 'asc' } = query;

	const rows = await db
		.select({ id: games.id, name: games.name })
		.from(games)
		.leftJoin(screenshots, and(eq(screenshots.gameId, games.id), eq(screenshots.isPrimary, 1)))
		.where(listFilter(query))
		.orderBy(listOrder(sort, direction), asc(games.id));

	const index = rows.findIndex((row) => row.id === id);
	if (index === -1) return { previous: null, next: null, position: 0, total: rows.length };

	return {
		previous: rows[index - 1] ?? null,
		next: rows[index + 1] ?? null,
		position: index + 1,
		total: rows.length
	};
}

export async function getGame(id: number): Promise<AdminGameDetail | null> {
	const found = await db.select().from(games).where(eq(games.id, id)).limit(1);
	if (found.length === 0) return null;

	const shots = await db
		.select()
		.from(screenshots)
		.where(eq(screenshots.gameId, id))
		.orderBy(desc(screenshots.isPrimary), asc(screenshots.id));

	return {
		...found[0],
		published: found[0].published === 1,
		screenshots: shots.map(
			(shot): AdminScreenshot => ({
				id: shot.id,
				gameId: shot.gameId,
				url: shot.url,
				difficulty: (shot.difficulty ?? 'medium') as Difficulty,
				isPrimary: shot.isPrimary === 1,
				createdAt: shot.createdAt
			})
		)
	};
}

export async function createGame(
	name: string,
	year: number,
	slug: string,
	published = true
): Promise<number> {
	const [row] = await db
		.insert(games)
		.values({ name, slug, year, published: published ? 1 : 0 })
		.returning({ id: games.id });
	return row.id;
}

/** Publishing is the deliberate act that puts a game in front of players. */
export async function setGamePublished(id: number, published: boolean): Promise<void> {
	await db
		.update(games)
		.set({ published: published ? 1 : 0 })
		.where(eq(games.id, id));
}

/** Drafts are hidden from players whatever their screenshots look like. */
export async function countDraftGames(): Promise<number> {
	const [row] = await db
		.select({ total: sql<number>`COUNT(*)` })
		.from(games)
		.where(eq(games.published, 0));

	return Number(row?.total ?? 0);
}

export async function updateGame(
	id: number,
	name: string,
	year: number,
	slug: string
): Promise<void> {
	await db.update(games).set({ name, year, slug }).where(eq(games.id, id));
}

/** Removes the game and its screenshot rows. Blob files are deleted by the caller. */
export async function deleteGame(id: number): Promise<string[]> {
	const urls = await db
		.select({ url: screenshots.url })
		.from(screenshots)
		.where(eq(screenshots.gameId, id));

	await db.delete(screenshots).where(eq(screenshots.gameId, id));
	await db.delete(games).where(eq(games.id, id));

	return urls.map((row) => row.url);
}

export async function addScreenshot(
	gameId: number,
	url: string,
	difficulty: Difficulty = 'medium'
): Promise<number> {
	const existing = await db
		.select({ id: screenshots.id })
		.from(screenshots)
		.where(eq(screenshots.gameId, gameId));

	const [row] = await db
		.insert(screenshots)
		.values({ gameId, url, difficulty, isPrimary: existing.length === 0 ? 1 : 0 })
		.returning({ id: screenshots.id });

	return row.id;
}

export async function setScreenshotDifficulty(id: number, difficulty: Difficulty): Promise<void> {
	await db.update(screenshots).set({ difficulty }).where(eq(screenshots.id, id));
}

/** Exactly one screenshot per game carries the primary flag. */
export async function setPrimaryScreenshot(gameId: number, screenshotId: number): Promise<void> {
	await db.update(screenshots).set({ isPrimary: 0 }).where(eq(screenshots.gameId, gameId));
	await db.update(screenshots).set({ isPrimary: 1 }).where(eq(screenshots.id, screenshotId));
}

/** Deletes the row and returns its URL plus the id that inherited the primary flag. */
export async function deleteScreenshot(id: number): Promise<string | null> {
	const found = await db.select().from(screenshots).where(eq(screenshots.id, id)).limit(1);
	if (found.length === 0) return null;

	const shot = found[0];
	await db.delete(screenshots).where(eq(screenshots.id, id));

	if (shot.isPrimary === 1) {
		const remaining = await db
			.select({ id: screenshots.id })
			.from(screenshots)
			.where(eq(screenshots.gameId, shot.gameId))
			.orderBy(asc(screenshots.id))
			.limit(1);

		if (remaining.length > 0) {
			await db.update(screenshots).set({ isPrimary: 1 }).where(eq(screenshots.id, remaining[0].id));
		}
	}

	return shot.url;
}

export async function findGameBySlug(slug: string): Promise<{ id: number } | null> {
	const found = await db.select({ id: games.id }).from(games).where(eq(games.slug, slug)).limit(1);
	return found[0] ?? null;
}
