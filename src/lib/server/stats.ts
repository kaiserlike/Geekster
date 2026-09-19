import { desc, sql } from 'drizzle-orm';
import { db } from './db';
import { games, screenshots, scores } from './schema';

export interface AdminStats {
	games: number;
	screenshots: number;
	gamesWithoutScreenshot: number;
	screenshotsOnBlob: number;
	scores: number;
}

export async function getStats(): Promise<AdminStats> {
	const [row] = await db
		.select({
			games: sql<number>`(SELECT COUNT(*) FROM ${games})`,
			screenshots: sql<number>`(SELECT COUNT(*) FROM ${screenshots})`,
			gamesWithoutScreenshot: sql<number>`(SELECT COUNT(*) FROM ${games} WHERE ${games.id} NOT IN (SELECT game_id FROM ${screenshots} WHERE is_primary = 1))`,
			screenshotsOnBlob: sql<number>`(SELECT COUNT(*) FROM ${screenshots} WHERE url LIKE 'http%')`,
			scores: sql<number>`(SELECT COUNT(*) FROM ${scores})`
		})
		.from(sql`(SELECT 1) AS one`);

	return {
		games: Number(row.games),
		screenshots: Number(row.screenshots),
		gamesWithoutScreenshot: Number(row.gamesWithoutScreenshot),
		screenshotsOnBlob: Number(row.screenshotsOnBlob),
		scores: Number(row.scores)
	};
}

export async function getRecentScores(limit = 10) {
	return db
		.select({
			id: scores.id,
			playerName: scores.playerName,
			totalScore: scores.totalScore,
			correctPlacements: scores.correctPlacements,
			bestStreak: scores.bestStreak,
			createdAt: scores.createdAt
		})
		.from(scores)
		.orderBy(desc(scores.id))
		.limit(limit);
}

export async function getRecentGames(limit = 5) {
	return db
		.select({ id: games.id, name: games.name, year: games.year })
		.from(games)
		.orderBy(desc(games.id))
		.limit(limit);
}
