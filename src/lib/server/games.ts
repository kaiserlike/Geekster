import { and, asc, desc, eq, inArray, like, sql, type SQL } from 'drizzle-orm';
import { db } from './db';
import { games, screenshots } from './schema';
import type { GameListQuery, GameSort, SortDirection } from '$lib/adminList';
import type {
	AdminGame,
	AdminGameDetail,
	AdminGameNeighbours,
	AdminScreenshot,
	CropRect
} from '$lib/types';
import {
	DEFAULT_DIFFICULTY,
	parseDifficulty,
	reconcilePrimaries,
	type Difficulty
} from '$lib/screenshotTiers';

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

/**
 * The outer row's id, always table-qualified. Drizzle renders `${games.id}` as a
 * bare `"id"` when the query has no join, and inside a subquery on
 * `screenshots` a bare `id` binds to `screenshots.id` — every correlated
 * subquery below would silently compare against the wrong table.
 */
const outerGameId = sql`${sql.identifier('games')}.${sql.identifier('id')}`;

/** The primary shot of one tier, as a correlated subquery on the outer `games` row. */
function primaryUrl(difficulty: Difficulty): SQL<string | null> {
	return sql<
		string | null
	>`(SELECT url FROM screenshots WHERE screenshots.game_id = ${outerGameId} AND screenshots.difficulty = ${difficulty} AND screenshots.is_primary = 1)`;
}

function hasPrimary(difficulty: Difficulty): SQL {
	return sql`EXISTS (SELECT 1 FROM screenshots WHERE screenshots.game_id = ${outerGameId} AND screenshots.difficulty = ${difficulty} AND screenshots.is_primary = 1)`;
}

/**
 * No join on `screenshots`: a game with a Normal and a Pro primary would come
 * back twice. Everything screenshot-related is a subquery on the game row.
 */
function listFilter({ search = '', missing = null, status = 'all' }: Partial<GameListQuery>) {
	const conditions: SQL[] = [];
	if (search.trim()) conditions.push(like(games.name, `%${search.trim()}%`));
	// A tier always has a primary once it has any shot, so "no primary of that
	// tier" is exactly "no shot of that tier".
	if (missing === 'normal') conditions.push(sql`NOT ${hasPrimary('normal')}`);
	if (missing === 'pro') conditions.push(sql`NOT ${hasPrimary('pro')}`);
	if (missing === 'both') {
		conditions.push(
			sql`NOT EXISTS (SELECT 1 FROM screenshots WHERE screenshots.game_id = ${outerGameId})`
		);
	}
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
			normalShot: primaryUrl('normal'),
			proShot: primaryUrl('pro'),
			screenshotCount: sql<number>`(SELECT COUNT(*) FROM screenshots WHERE screenshots.game_id = ${outerGameId})`
		})
		.from(games)
		.where(listFilter(query))
		.orderBy(listOrder(sort, direction), asc(games.id));

	return rows.map((row) => ({
		...row,
		published: row.published === 1,
		screenshotCount: Number(row.screenshotCount)
	}));
}

/** How many games lack a primary of `difficulty`, whatever the list is filtered to. */
export async function countGamesMissing(difficulty: Difficulty): Promise<number> {
	const [row] = await db
		.select({ total: sql<number>`COUNT(*)` })
		.from(games)
		.where(sql`NOT ${hasPrimary(difficulty)}`);

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
				difficulty: parseDifficulty(shot.difficulty),
				isPrimary: shot.isPrimary === 1,
				sourceUrl: shot.sourceUrl,
				crop:
					shot.cropX !== null &&
					shot.cropY !== null &&
					shot.cropWidth !== null &&
					shot.cropHeight !== null
						? { x: shot.cropX, y: shot.cropY, width: shot.cropWidth, height: shot.cropHeight }
						: null,
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

/**
 * Brings the game's primary flags back in line with `reconcilePrimaries()`:
 * one primary per tier. Clears are written before sets in one batch, so the
 * partial unique index never sees two primaries in a tier, even for a moment.
 */
async function reconcileGame(gameId: number, preferred?: number): Promise<void> {
	const shots = await db
		.select({
			id: screenshots.id,
			difficulty: screenshots.difficulty,
			isPrimary: screenshots.isPrimary
		})
		.from(screenshots)
		.where(eq(screenshots.gameId, gameId));

	const { clear, set } = reconcilePrimaries(
		shots.map((shot) => ({ ...shot, isPrimary: shot.isPrimary === 1 })),
		preferred
	);
	if (clear.length === 0 && set.length === 0) return;

	const clearing = db
		.update(screenshots)
		.set({ isPrimary: 0 })
		.where(inArray(screenshots.id, clear));
	const setting = db.update(screenshots).set({ isPrimary: 1 }).where(inArray(screenshots.id, set));

	if (clear.length === 0) await setting;
	else if (set.length === 0) await clearing;
	else await db.batch([clearing, setting]);
}

/**
 * Adds a shot to one tier. It is inserted as non-primary and then reconciled,
 * so it becomes primary only when its tier had no shot yet — adding a Pro shot
 * never touches the Normal primary.
 */
export async function addScreenshot(
	gameId: number,
	url: string,
	difficulty: Difficulty = DEFAULT_DIFFICULTY,
	sourceUrl: string | null = null,
	crop: CropRect | null = null
): Promise<number> {
	const [row] = await db
		.insert(screenshots)
		.values({
			gameId,
			url,
			difficulty,
			sourceUrl,
			cropX: crop?.x ?? null,
			cropY: crop?.y ?? null,
			cropWidth: crop?.width ?? null,
			cropHeight: crop?.height ?? null,
			isPrimary: 0
		})
		.returning({ id: screenshots.id });

	await reconcileGame(gameId);
	return row.id;
}

/**
 * Moves a shot to the other tier. It arrives as an extra, never displacing the
 * primary already there, and the tier it left gets a replacement primary.
 */
export async function moveScreenshot(
	gameId: number,
	screenshotId: number,
	difficulty: Difficulty
): Promise<void> {
	await db
		.update(screenshots)
		.set({ difficulty, isPrimary: 0 })
		.where(and(eq(screenshots.id, screenshotId), eq(screenshots.gameId, gameId)));

	await reconcileGame(gameId);
}

/** Makes a shot the primary of its own tier; the other tier is left alone. */
export async function setPrimaryScreenshot(gameId: number, screenshotId: number): Promise<void> {
	await reconcileGame(gameId, screenshotId);
}

/** Deletes the row, promotes a replacement in its tier, and returns its URL for the blob delete. */
export async function deleteScreenshot(gameId: number, id: number): Promise<string | null> {
	const found = await db
		.select()
		.from(screenshots)
		.where(and(eq(screenshots.id, id), eq(screenshots.gameId, gameId)))
		.limit(1);
	if (found.length === 0) return null;

	await db.delete(screenshots).where(eq(screenshots.id, id));
	await reconcileGame(gameId);

	return found[0].url;
}

/**
 * Swaps a shot's image for a re-crop of it (US-8.8). The row keeps its id, its
 * tier, its primary flag and its source; only the file and the crop change.
 * Returns the URL it replaced, for the caller to delete from the blob store,
 * or null when the shot does not belong to this game.
 */
export async function replaceScreenshotImage(
	gameId: number,
	id: number,
	url: string,
	crop: CropRect | null
): Promise<string | null> {
	const found = await db
		.select({ url: screenshots.url })
		.from(screenshots)
		.where(and(eq(screenshots.id, id), eq(screenshots.gameId, gameId)))
		.limit(1);
	if (found.length === 0) return null;

	await db
		.update(screenshots)
		.set({
			url,
			cropX: crop?.x ?? null,
			cropY: crop?.y ?? null,
			cropWidth: crop?.width ?? null,
			cropHeight: crop?.height ?? null
		})
		.where(eq(screenshots.id, id));

	return found[0].url;
}

export async function findGameBySlug(slug: string): Promise<{ id: number } | null> {
	const found = await db.select({ id: games.id }).from(games).where(eq(games.slug, slug)).limit(1);
	return found[0] ?? null;
}
