import { desc, sql } from 'drizzle-orm';
import { db } from './db';
import { games, runs, screenshots, scores, shareCounts } from './schema';
import type { Difficulty } from '$lib/screenshotTiers';

export interface AdminStats {
	games: number;
	screenshots: number;
	/**
	 * Games without a Normal primary. The game only plays Normal until Sprint 8
	 * slice 4, so these never appear in a round — Pro-only games included.
	 */
	gamesWithoutNormal: number;
	/** Published AND a primary shot of that tier — what each mode can serve. */
	liveNormal: number;
	livePro: number;
	drafts: number;
	screenshotsOnBlob: number;
	scores: number;
}

/** The live rule of a run's pool (`/api/runs`), counted: published AND a primary shot of that tier. */
function liveCount(difficulty: Difficulty) {
	return sql<number>`(SELECT COUNT(*) FROM ${games} WHERE ${games.published} = 1 AND ${games.id} IN (SELECT game_id FROM ${screenshots} WHERE is_primary = 1 AND difficulty = ${difficulty}))`;
}

export async function getStats(): Promise<AdminStats> {
	const [row] = await db
		.select({
			games: sql<number>`(SELECT COUNT(*) FROM ${games})`,
			screenshots: sql<number>`(SELECT COUNT(*) FROM ${screenshots})`,
			gamesWithoutNormal: sql<number>`(SELECT COUNT(*) FROM ${games} WHERE ${games.id} NOT IN (SELECT game_id FROM ${screenshots} WHERE is_primary = 1 AND difficulty = 'normal'))`,
			liveNormal: liveCount('normal'),
			livePro: liveCount('pro'),
			drafts: sql<number>`(SELECT COUNT(*) FROM ${games} WHERE ${games.published} = 0)`,
			screenshotsOnBlob: sql<number>`(SELECT COUNT(*) FROM ${screenshots} WHERE url LIKE 'http%')`,
			scores: sql<number>`(SELECT COUNT(*) FROM ${scores})`
		})
		.from(sql`(SELECT 1) AS one`);

	return {
		games: Number(row.games),
		screenshots: Number(row.screenshots),
		gamesWithoutNormal: Number(row.gamesWithoutNormal),
		liveNormal: Number(row.liveNormal),
		livePro: Number(row.livePro),
		drafts: Number(row.drafts),
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

/** The dashboard's window for activity: today and the six UTC days before it */
export const ACTIVITY_DAYS = 7;

export interface Activity {
	runsStarted: number;
	runsFinished: number;
	/** Daily Runs started: one per device and day, so the Daily's players */
	dailyPlayers: number;
	dailyFinished: number;
	/** Shares by the share sheet or the clipboard; a download is counted apart */
	sharesDaily: number;
	sharesEndless: number;
	downloads: number;
}

/**
 * Play and sharing over the last `ACTIVITY_DAYS` UTC days (Sprint 10f, decision 10f-1): runs
 * from `runs`, which the referee writes anyway, and the anonymous `share_counts`. No tracker
 */
export async function getActivity(): Promise<Activity> {
	const since = sql`date('now', ${`-${ACTIVITY_DAYS - 1} days`})`;
	const started = sql`substr(${runs.createdAt}, 1, 10) >= ${since}`;
	const finished = sql`${runs.stage} = 'over' AND substr(${runs.finishedAt}, 1, 10) >= ${since}`;
	const shares = (where: ReturnType<typeof sql>) =>
		sql<number>`(SELECT COALESCE(SUM(${shareCounts.count}), 0) FROM ${shareCounts} WHERE ${shareCounts.date} >= ${since} AND ${where})`;
	const [row] = await db
		.select({
			runsStarted: sql<number>`(SELECT COUNT(*) FROM ${runs} WHERE ${started})`,
			runsFinished: sql<number>`(SELECT COUNT(*) FROM ${runs} WHERE ${finished})`,
			dailyPlayers: sql<number>`(SELECT COUNT(*) FROM ${runs} WHERE ${runs.mode} = 'daily' AND ${started})`,
			dailyFinished: sql<number>`(SELECT COUNT(*) FROM ${runs} WHERE ${runs.mode} = 'daily' AND ${finished})`,
			sharesDaily: shares(
				sql`${shareCounts.kind} = 'daily' AND ${shareCounts.method} != 'download'`
			),
			sharesEndless: shares(
				sql`${shareCounts.kind} = 'endless' AND ${shareCounts.method} != 'download'`
			),
			downloads: shares(sql`${shareCounts.method} = 'download'`)
		})
		.from(sql`(SELECT 1) AS one`);

	return {
		runsStarted: Number(row.runsStarted),
		runsFinished: Number(row.runsFinished),
		dailyPlayers: Number(row.dailyPlayers),
		dailyFinished: Number(row.dailyFinished),
		sharesDaily: Number(row.sharesDaily),
		sharesEndless: Number(row.sharesEndless),
		downloads: Number(row.downloads)
	};
}
