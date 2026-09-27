import { and, count, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { games, screenshots } from './schema';
import { DEFAULT_DIFFICULTY, isDifficulty, type Difficulty } from '$lib/screenshotTiers';
import { isProOpen, resolveProMinPool, type ProGate } from '$lib/modes';

/**
 * `?difficulty=normal|pro`, defaulting to `normal`. Null for anything else, so
 * the caller can answer 400 rather than silently serve the wrong pool.
 */
export function difficultyParam(url: URL): Difficulty | null {
	const value = url.searchParams.get('difficulty') ?? DEFAULT_DIFFICULTY;
	return isDifficulty(value) ? value : null;
}

/** The primary screenshot of one tier. Naming the tier keeps it one row per game. */
function primaryShotOf(difficulty: Difficulty) {
	return and(
		eq(screenshots.gameId, games.id),
		eq(screenshots.isPrimary, 1),
		eq(screenshots.difficulty, difficulty)
	);
}

/**
 * The games a mode can serve: published AND a primary screenshot of that tier.
 * One row per game — the join names the tier, so a game with a Normal and a Pro
 * primary is not returned twice. Shared by `/api/games` and `/api/games/random`.
 */
export function selectLiveGames(difficulty: Difficulty) {
	return db
		.select({
			id: games.id,
			name: games.name,
			year: games.year,
			screenshot: screenshots.url
		})
		.from(games)
		.innerJoin(screenshots, primaryShotOf(difficulty))
		.where(eq(games.published, 1))
		.$dynamic();
}

/** How many games a mode can serve — one `COUNT`, never the pool itself. */
export async function countLiveGames(difficulty: Difficulty): Promise<number> {
	const [row] = await db
		.select({ n: count() })
		.from(games)
		.innerJoin(screenshots, primaryShotOf(difficulty))
		.where(eq(games.published, 1));
	return row?.n ?? 0;
}

/** The minimum in force on this deployment; `PRO_MIN_POOL_OVERRIDE` is ignored on production. */
export function proMinPool(): number {
	return resolveProMinPool(env.PRO_MIN_POOL_OVERRIDE, env.VERCEL_ENV);
}

/**
 * Whether Pro is offered. The welcome screen draws the mode choice from it, and
 * the score API checks it before storing a Pro score. A database error reads as
 * closed: the worst case is Pro showing "Coming soon" until the next load.
 */
export async function getProGate(): Promise<ProGate> {
	const min = proMinPool();
	try {
		const n = await countLiveGames('pro');
		return { open: isProOpen(n, min), count: n, min };
	} catch {
		return { open: false, count: 0, min };
	}
}
