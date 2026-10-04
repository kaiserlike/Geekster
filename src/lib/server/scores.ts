// The global board (Sprint 10c). Every row of `scores` was written by the referee at the end of a
// run (`nextCard()` in `runs.ts`); this module reads them, names them and, for the admin,
// deletes them. The board shows each device's best run in a mode: a score written without a
// device (a scripted run, a request without one) counts as a player of its own.

import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { db } from './db';
import { scores } from './schema';
import { utcDay } from '$lib/daily';
import {
	BOARD_PAGE_SIZE,
	isBoardMode,
	type BoardMode,
	pageCount,
	pageOfPosition,
	periodStart,
	type BoardPeriod
} from '$lib/globalBoard';
import { checkName, type NameProblem } from '$lib/playerName';
import type { GlobalBoardPage, GlobalScoreEntry, Standing } from '$lib/types';

/** The name on a score until its player gives one */
export const ANONYMOUS = 'Anonymous';

// The player a row belongs to: its device, or the row itself when it has none
const PLAYER = sql`COALESCE(${scores.deviceId}, 'row:' || ${scores.id})`;

/**
 * The rows of a board: an endless mode since `since` (null for all-time), or the Daily Run of
 * one UTC day (10d), where every device has one score at most
 */
function inBoard(mode: BoardMode, since: string | null, day: string | null = null): SQL {
	if (mode === 'daily') {
		return sql`${scores.difficulty} = 'daily' AND ${scores.dailyDate} = ${day}`;
	}
	return since === null
		? sql`${scores.difficulty} = ${mode}`
		: sql`${scores.difficulty} = ${mode} AND ${scores.createdAt} >= ${since}`;
}

async function countPlayers(where: SQL): Promise<number> {
	const [row] = await db.all<{ players: number }>(
		sql`SELECT COUNT(DISTINCT ${PLAYER}) AS players FROM ${scores} WHERE ${where}`
	);
	return Number(row?.players ?? 0);
}

interface BoardQuery {
	mode: BoardMode;
	period: BoardPeriod;
	page: number;
	/** The asking device: its rows come back marked `mine` */
	deviceId: string | null;
	now?: Date;
}

/** One page of the board: each player's best run in the mode and period, ranked */
export async function boardPage({
	mode,
	period,
	page,
	deviceId,
	now = new Date()
}: BoardQuery): Promise<GlobalBoardPage> {
	// The Daily's board is today's; its period is the day
	const where = inBoard(mode, periodStart(period, now), utcDay(now));
	const players = await countPlayers(where);
	const pages = pageCount(players);
	const shown = Math.min(page, pages);

	// A player's best is their highest score, the earlier one on a tie. RANK() lets ties share a
	// rank; `pos` is the row's place in the list, which decides its page. The page's rows and the
	// asking device's own row come back in one query: the board says where the player is even
	// when that is on another page
	const first = (shown - 1) * BOARD_PAGE_SIZE;
	const found = await db.all<{
		id: number;
		rank: number;
		pos: number;
		player_name: string;
		total_score: number;
		correct_placements: number | null;
		best_streak: number | null;
		created_at: string | null;
		mine: number;
	}>(sql`
		WITH best AS (
			SELECT ${scores.id} AS id, ${scores.playerName} AS player_name,
				${scores.totalScore} AS total_score, ${scores.correctPlacements} AS correct_placements,
				${scores.bestStreak} AS best_streak, ${scores.createdAt} AS created_at,
				${scores.deviceId} AS device_id,
				ROW_NUMBER() OVER (
					PARTITION BY ${PLAYER}
					ORDER BY ${scores.totalScore} DESC, ${scores.createdAt} ASC, ${scores.id} ASC
				) AS n
			FROM ${scores}
			WHERE ${where}
		),
		ranked AS (
			SELECT id, player_name, total_score, correct_placements, best_streak, created_at,
				RANK() OVER (ORDER BY total_score DESC) AS rank,
				ROW_NUMBER() OVER (ORDER BY total_score DESC, created_at ASC, id ASC) AS pos,
				COALESCE(device_id = ${deviceId}, 0) AS mine
			FROM best
			WHERE n = 1
		)
		SELECT * FROM ranked
		WHERE (pos > ${first} AND pos <= ${first + BOARD_PAGE_SIZE}) OR mine = 1
		ORDER BY pos
	`);

	const entry = (row: (typeof found)[number]): GlobalScoreEntry => ({
		id: Number(row.id),
		rank: Number(row.rank),
		playerName: row.player_name,
		totalScore: Number(row.total_score),
		correctPlacements: row.correct_placements,
		bestStreak: row.best_streak,
		createdAt: row.created_at,
		mine: Boolean(Number(row.mine))
	});
	const onPage = (row: (typeof found)[number]) =>
		Number(row.pos) > first && Number(row.pos) <= first + BOARD_PAGE_SIZE;
	const own = found.find((row) => Number(row.mine) === 1);

	return {
		rows: found.filter(onPage).map(entry),
		players,
		page: shown,
		pages,
		me: own ? { ...entry(own), page: pageOfPosition(Number(own.pos)) } : null
	};
}

/**
 * Where the device that ran `runId` stands once that run's score is written: all-time in its
 * endless mode (without a device the run's own score is its best), or among today's players for
 * a Daily Run (10d), which has one score per device
 */
export async function standingOf(runId: string): Promise<Standing | null> {
	const [own] = await db
		.select({
			score: scores.totalScore,
			deviceId: scores.deviceId,
			mode: scores.difficulty,
			dailyDate: scores.dailyDate
		})
		.from(scores)
		.where(eq(scores.runId, runId));
	if (!own || !isBoardMode(own.mode)) return null;

	if (own.mode === 'daily') {
		const where = inBoard('daily', null, own.dailyDate);
		const [row] = await db.all<{ ahead: number; players: number }>(sql`
			SELECT SUM(CASE WHEN ${scores.totalScore} > ${own.score} THEN 1 ELSE 0 END) AS ahead,
				COUNT(DISTINCT ${PLAYER}) AS players
			FROM ${scores} WHERE ${where}
		`);
		return {
			rank: Number(row?.ahead ?? 0) + 1,
			players: Number(row?.players ?? 0),
			best: own.score,
			previousBest: null,
			scope: 'today'
		};
	}

	let best = own.score;
	let previousBest: number | null = null;
	if (own.deviceId !== null) {
		const [earlier] = await db
			.select({ best: sql<number | null>`MAX(${scores.totalScore})` })
			.from(scores)
			.where(
				and(
					eq(scores.deviceId, own.deviceId),
					eq(scores.difficulty, own.mode),
					sql`${scores.runId} IS NOT ${runId}`
				)
			);
		previousBest =
			earlier?.best === null || earlier?.best === undefined ? null : Number(earlier.best);
		best = Math.max(best, previousBest ?? best);
	}

	const where = inBoard(own.mode, null);
	const [ahead] = await db.all<{ ahead: number }>(sql`
		SELECT COUNT(*) AS ahead FROM (
			SELECT MAX(${scores.totalScore}) AS best FROM ${scores} WHERE ${where} GROUP BY ${PLAYER}
		) WHERE best > ${best}
	`);
	return {
		rank: Number(ahead?.ahead ?? 0) + 1,
		players: await countPlayers(where),
		best,
		previousBest,
		scope: 'allTime'
	};
}

/** The name a client sent with the end of its run, or Anonymous if it sent none or a refused one */
export function nameForBoard(raw: unknown): string {
	if (typeof raw !== 'string') return ANONYMOUS;
	const check = checkName(raw);
	return check.ok ? check.name : ANONYMOUS;
}

export type NameResult =
	| { ok: true; name: string }
	| { ok: false; problem: NameProblem | 'notFound' | 'named' };

/**
 * Puts a name on the score of a finished run that has none yet (decision 10c-1: the first run's
 * result screen asks for it). The run id is the credential. A score that has a name keeps it:
 * the name is a snapshot (10c-3), so a rename never rewrites one
 */
export async function nameRunScore(runId: string, raw: unknown): Promise<NameResult> {
	const check = checkName(typeof raw === 'string' ? raw : '');
	if (!check.ok) return check;
	const named = await db
		.update(scores)
		.set({ playerName: check.name })
		.where(and(eq(scores.runId, runId), eq(scores.playerName, ANONYMOUS)))
		.returning({ id: scores.id });
	if (named.length > 0) return { ok: true, name: check.name };
	const [exists] = await db.select({ id: scores.id }).from(scores).where(eq(scores.runId, runId));
	return { ok: false, problem: exists ? 'named' : 'notFound' };
}

/** Rows per page of the admin's score list */
export const ADMIN_SCORES_PAGE_SIZE = 50;

interface AdminScoreQuery {
	mode: BoardMode | null;
	/** Part of a player name */
	q: string;
	page: number;
}

/** The admin's list: every row, newest first, filtered by mode and name */
export async function listScores({ mode, q, page }: AdminScoreQuery) {
	const where = and(
		mode ? eq(scores.difficulty, mode) : undefined,
		// LIKE's wildcards in the search are literal
		q
			? sql`${scores.playerName} LIKE ${`%${q.replace(/[%_\\]/g, '\\$&')}%`} ESCAPE '\\'`
			: undefined
	);
	const [{ total }] = await db
		.select({ total: sql<number>`COUNT(*)` })
		.from(scores)
		.where(where);
	const rows = await db
		.select({
			id: scores.id,
			playerName: scores.playerName,
			totalScore: scores.totalScore,
			correctPlacements: scores.correctPlacements,
			wrongPlacements: scores.wrongPlacements,
			bestStreak: scores.bestStreak,
			difficulty: scores.difficulty,
			createdAt: scores.createdAt,
			refereed: sql<number>`${scores.runId} IS NOT NULL`
		})
		.from(scores)
		.where(where)
		.orderBy(desc(scores.id))
		.limit(ADMIN_SCORES_PAGE_SIZE)
		.offset((page - 1) * ADMIN_SCORES_PAGE_SIZE);
	return {
		rows: rows.map((row) => ({ ...row, refereed: Boolean(Number(row.refereed)) })),
		total: Number(total),
		pages: Math.max(1, Math.ceil(Number(total) / ADMIN_SCORES_PAGE_SIZE))
	};
}

/** Removes one row from the board. Its run stays: a deleted score stays deleted */
export async function deleteScore(id: number): Promise<boolean> {
	const deleted = await db.delete(scores).where(eq(scores.id, id)).returning({ id: scores.id });
	return deleted.length > 0;
}
