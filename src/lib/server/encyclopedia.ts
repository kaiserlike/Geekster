import { and, countDistinct, eq, inArray } from 'drizzle-orm';
import type { db as appDb } from './db';
import { games, screenshots } from './schema';

type Db = typeof appDb;

/**
 * The CDN keeps an encyclopedia page for an hour and serves the old one for a day while it
 * fetches the new: the pages change when a game is published, not per request
 */
export const ENCYCLOPEDIA_CACHE = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

/**
 * How many of our games each year has: published, with a primary screenshot in either tier —
 * live in Normal or in Pro. Years without one are missing from the map
 */
export async function liveGamesPerYear(
	db: Db,
	years: readonly number[]
): Promise<Map<number, number>> {
	if (years.length === 0) return new Map();
	const rows = await db
		.select({ year: games.year, n: countDistinct(games.id) })
		.from(games)
		.innerJoin(screenshots, and(eq(screenshots.gameId, games.id), eq(screenshots.isPrimary, 1)))
		.where(and(eq(games.published, 1), inArray(games.year, [...years])))
		.groupBy(games.year);
	return new Map(rows.map((row) => [row.year, row.n]));
}
