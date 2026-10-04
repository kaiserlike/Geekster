// The Daily Run's set and status (Sprint 10d). The set is a snapshot per UTC day in
// `daily_challenges`, written by the day's first request; the runs themselves are ordinary
// refereed runs (`runs.ts`) with `mode = 'daily'` and their day in `daily_date`.

import { and, asc, desc, eq, gte, isNotNull, sql } from 'drizzle-orm';
import { db } from './db';
import { dailyChallenges, runs, scores } from './schema';
import { selectLiveGames } from './liveGames';
import {
	addDays,
	DAILY_NO_REPEAT_DAYS,
	dailyStreak,
	dayNumber,
	msUntilNextDaily,
	pickDaily,
	utcDay
} from '$lib/daily';
import type { DailyInfo, DailyStatus } from '$lib/types';

/** The live Normal pool can't fill a Daily Run */
export class DailyUnavailable extends Error {}

export interface TodaysDaily extends DailyInfo {
	gameIds: number[];
}

/** Today's set: read, or drawn and written once if this is the day's first request */
export async function todaysDaily(now = new Date()): Promise<TodaysDaily> {
	const date = utcDay(now);
	const read = async () => {
		const [row] = await db.select().from(dailyChallenges).where(eq(dailyChallenges.date, date));
		return row ? { date, number: row.number, gameIds: JSON.parse(row.gameIds) as number[] } : null;
	};
	const existing = await read();
	if (existing) return existing;

	const [pool, recentRows, [first]] = await Promise.all([
		selectLiveGames('normal'),
		db
			.select({ gameIds: dailyChallenges.gameIds })
			.from(dailyChallenges)
			.where(gte(dailyChallenges.date, addDays(date, -DAILY_NO_REPEAT_DAYS))),
		db
			.select({ date: dailyChallenges.date })
			.from(dailyChallenges)
			.orderBy(asc(dailyChallenges.date))
			.limit(1)
	]);
	const recent = new Set(recentRows.flatMap((row) => JSON.parse(row.gameIds) as number[]));
	const gameIds = pickDaily(pool, recent);
	if (!gameIds) throw new DailyUnavailable();

	// Two first requests may draw at once: the first insert wins, and both read it back
	await db
		.insert(dailyChallenges)
		.values({
			date,
			number: dayNumber(first?.date ?? null, date),
			gameIds: JSON.stringify(gameIds)
		})
		.onConflictDoNothing();
	const written = await read();
	if (!written) throw new DailyUnavailable();
	return written;
}

/** This device's run of `date`, if it has one */
export async function dailyRunOf(deviceId: string, date: string) {
	const [row] = await db
		.select()
		.from(runs)
		.where(and(eq(runs.deviceId, deviceId), eq(runs.dailyDate, date)));
	return row ?? null;
}

/** Rank of `score` among the Daily Run scores of `date` (ties share), and how many played */
export async function dailyRank(
	date: string,
	score: number
): Promise<{ rank: number; players: number }> {
	const [row] = await db
		.select({
			ahead: sql<number>`SUM(CASE WHEN ${scores.totalScore} > ${score} THEN 1 ELSE 0 END)`,
			players: sql<number>`COUNT(*)`
		})
		.from(scores)
		.where(and(eq(scores.difficulty, 'daily'), eq(scores.dailyDate, date)));
	return { rank: Number(row?.ahead ?? 0) + 1, players: Number(row?.players ?? 0) };
}

/** What the welcome screen shows: today's number, the device's streak and its run of today */
export async function dailyStatus(deviceId: string | null, now = new Date()): Promise<DailyStatus> {
	const { date, number } = await todaysDaily(now);
	const status: DailyStatus = {
		number,
		date,
		msUntilNext: msUntilNextDaily(now),
		streak: 0,
		today: null
	};
	if (!deviceId) return status;

	const finished = await db
		.select({ day: runs.dailyDate })
		.from(runs)
		.where(and(eq(runs.deviceId, deviceId), isNotNull(runs.dailyDate), eq(runs.stage, 'over')))
		.orderBy(desc(runs.dailyDate))
		.limit(400);
	status.streak = dailyStreak(
		finished.map((row) => row.day!),
		date
	);

	const run = await dailyRunOf(deviceId, date);
	if (!run) return status;
	if (run.stage !== 'over') {
		status.today = { over: false };
		return status;
	}
	const { rank, players } = await dailyRank(date, run.totalScore).catch(() => ({
		rank: null,
		players: 0
	}));
	status.today = { over: true, score: run.totalScore, marks: run.marks, rank, players };
	return status;
}
