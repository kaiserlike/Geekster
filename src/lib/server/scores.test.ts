// The board's guarantees against a real database (`testDb.ts`): each player once, at their best,
// in the period asked for. The rows are written here directly; how a run writes its one row is
// `runs.test.ts`'s business.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BOARD_PAGE_SIZE, type BoardPeriod } from '$lib/globalBoard';
import { scores } from './schema';
import { db, freshDb } from './testDb';
import { boardPage, standingOf } from './scores';

vi.mock('./db', () => import('./testDb'));

// A Wednesday; its week started on Monday 2026-10-05 00:00:00 UTC
const NOW = new Date('2026-10-07T12:00:00Z');
const LAST_WEEK = '2026-10-04 23:59:59';
const THIS_WEEK = '2026-10-05 00:00:00';

interface Row {
	name: string;
	score: number;
	device: string | null;
	at: string;
	mode?: 'normal' | 'pro' | 'daily';
	runId?: string;
}

async function insert(rows: Row[]): Promise<void> {
	for (const row of rows) {
		await db.insert(scores).values({
			playerName: row.name,
			totalScore: row.score,
			deviceId: row.device,
			createdAt: row.at,
			difficulty: row.mode ?? 'normal',
			runId: row.runId ?? null
		});
	}
}

const page = (period: BoardPeriod, deviceId: string | null = null) =>
	boardPage({ mode: 'normal', period, page: 1, deviceId, now: NOW });

beforeEach(async () => {
	await freshDb();
});

describe('boardPage', () => {
	beforeEach(async () => {
		await insert([
			{ name: 'Ada', score: 900, device: 'a', at: LAST_WEEK },
			{ name: 'Ada', score: 300, device: 'a', at: THIS_WEEK },
			{ name: 'Ada', score: 500, device: 'a', at: THIS_WEEK },
			{ name: 'Bo', score: 700, device: 'b', at: THIS_WEEK },
			{ name: 'Scripted', score: 600, device: null, at: LAST_WEEK },
			{ name: 'Scripted', score: 650, device: null, at: LAST_WEEK },
			{ name: 'Pro player', score: 9999, device: 'c', at: THIS_WEEK, mode: 'pro' }
		]);
	});

	it("shows each device's best once, all-time; a score without a device is a player of its own", async () => {
		const board = await page('all');
		expect(board.rows.map((r) => [r.playerName, r.totalScore, r.rank])).toEqual([
			['Ada', 900, 1],
			['Bo', 700, 2],
			['Scripted', 650, 3],
			['Scripted', 600, 4]
		]);
		expect(board.players).toBe(4);
	});

	it("counts only this week's runs, from Monday 00:00 UTC", async () => {
		const board = await page('week');
		expect(board.rows.map((r) => [r.playerName, r.totalScore])).toEqual([
			['Bo', 700],
			['Ada', 500]
		]);
		expect(board.players).toBe(2);
	});

	it('lets a tie share a rank, the earlier score first', async () => {
		await insert([{ name: 'Cy', score: 700, device: 'cy', at: '2026-10-06 10:00:00' }]);
		const board = await page('week');
		expect(board.rows.map((r) => [r.playerName, r.rank])).toEqual([
			['Bo', 1],
			['Cy', 1],
			['Ada', 3]
		]);
	});

	it("returns the asking device's row even when it is on another page", async () => {
		await insert(
			Array.from({ length: BOARD_PAGE_SIZE }, (_v, i) => ({
				name: `Player ${i}`,
				score: 10_000 + i,
				device: `top-${i}`,
				at: THIS_WEEK
			}))
		);
		const board = await page('all', 'b');
		expect(board.rows).toHaveLength(BOARD_PAGE_SIZE);
		expect(board.rows.some((r) => r.mine)).toBe(false);
		expect(board.me).toMatchObject({ playerName: 'Bo', totalScore: 700, page: 2, mine: true });
	});
});

describe('standingOf', () => {
	it("ranks a run by the device's best, and says what the best was before it", async () => {
		await insert([
			{ name: 'Ada', score: 800, device: 'a', at: LAST_WEEK, runId: 'r1' },
			{ name: 'Bo', score: 700, device: 'b', at: LAST_WEEK, runId: 'r2' },
			{ name: 'Ada', score: 400, device: 'a', at: THIS_WEEK, runId: 'r3' }
		]);
		expect(await standingOf('r3')).toEqual({
			rank: 1,
			players: 2,
			best: 800,
			previousBest: 800,
			scope: 'allTime'
		});
	});

	it("ranks a Daily Run among that day's players only", async () => {
		const daily = (runId: string, device: string, score: number, day: string) =>
			db.insert(scores).values({
				playerName: device,
				totalScore: score,
				deviceId: device,
				difficulty: 'daily',
				dailyDate: day,
				runId
			});
		await daily('d1', 'a', 900, '2026-10-06');
		await daily('d2', 'b', 300, '2026-10-07');
		await daily('d3', 'c', 500, '2026-10-07');
		expect(await standingOf('d2')).toMatchObject({ rank: 2, players: 2, scope: 'today' });
	});
});
