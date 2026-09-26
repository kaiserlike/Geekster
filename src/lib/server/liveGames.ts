import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { games, screenshots } from './schema';
import { DEFAULT_DIFFICULTY, isDifficulty, type Difficulty } from '$lib/screenshotTiers';

/**
 * `?difficulty=normal|pro`, defaulting to `normal`. Null for anything else, so
 * the caller can answer 400 rather than silently serve the wrong pool.
 */
export function difficultyParam(url: URL): Difficulty | null {
	const value = url.searchParams.get('difficulty') ?? DEFAULT_DIFFICULTY;
	return isDifficulty(value) ? value : null;
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
		.innerJoin(
			screenshots,
			and(
				eq(screenshots.gameId, games.id),
				eq(screenshots.isPrimary, 1),
				eq(screenshots.difficulty, difficulty)
			)
		)
		.where(eq(games.published, 1))
		.$dynamic();
}
