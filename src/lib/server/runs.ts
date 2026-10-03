// The referee (Sprint 10b): a run's state lives in a `runs` row, and every request reads it,
// asks `runRules.ts` what the request does, and writes the result back on the condition that
// the row is still where it was read (`stage` and `position`). A double tap, a retried request
// or two tabs on one run therefore cannot place a card twice or score a bonus twice: the second
// write matches no row and is refused.

import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { games, runs, scores, screenshots } from './schema';
import { proMinPool, selectLiveGames } from './liveGames';
import { nameForBoard, standingOf } from './scores';
import { isProOpen } from '$lib/modes';
import { isDifficulty, type Difficulty } from '$lib/screenshotTiers';
import type {
	BonusGuess,
	BonusResponse,
	NextResponse,
	PlaceResponse,
	RunCard,
	RunStartResponse
} from '$lib/types';
import {
	advance,
	expectStage,
	newRun,
	place,
	remainingAfter,
	RunConflict,
	scoreBonus,
	timelineYears,
	type DatedGame,
	type RunRecord,
	type RunStage
} from './runRules';

// An anchor plus one card is the smallest run that is playable at all
const MIN_RUN_GAMES = 2;

/** No run with that id */
export class RunNotFound extends Error {}
/** Pro was asked for while it is gated */
export class ProClosed extends Error {}
/** The live pool is too small for a run */
export class PoolTooSmall extends Error {}
/** A game of the run was deleted while it was being played */
export class RunBroken extends Error {}

export { RunConflict };

/** A run id: 32 random hex characters, the run's only credential */
function newRunId(): string {
	return randomUUID().replaceAll('-', '');
}

type RunRow = typeof runs.$inferSelect;

function toRecord(row: RunRow): RunRecord {
	if (!isDifficulty(row.mode)) throw new RunBroken(`run ${row.id} has mode ${row.mode}`);
	return {
		mode: row.mode,
		gameIds: JSON.parse(row.gameIds) as number[],
		position: row.position,
		stage: row.stage as RunStage,
		lives: row.lives,
		streak: row.streak,
		bestStreak: row.bestStreak,
		livesWonBack: row.livesWonBack,
		totalScore: row.totalScore,
		correct: row.correct,
		wrong: row.wrong,
		bonusDeadline: row.bonusDeadline
	};
}

/** The columns a transition can change */
function changes(run: RunRecord) {
	return {
		position: run.position,
		stage: run.stage,
		lives: run.lives,
		streak: run.streak,
		bestStreak: run.bestStreak,
		livesWonBack: run.livesWonBack,
		totalScore: run.totalScore,
		correct: run.correct,
		wrong: run.wrong,
		bonusDeadline: run.bonusDeadline
	};
}

/** The row, still where `before` found it */
function stillAt(id: string, before: RunRecord) {
	return and(eq(runs.id, id), eq(runs.stage, before.stage), eq(runs.position, before.position));
}

async function loadRun(id: string): Promise<RunRecord> {
	const [row] = await db.select().from(runs).where(eq(runs.id, id));
	if (!row) throw new RunNotFound(id);
	return toRecord(row);
}

/** Writes `after` only if the row is still where `before` was read; otherwise someone else moved it */
async function save(id: string, before: RunRecord, after: RunRecord): Promise<void> {
	const written = await db
		.update(runs)
		.set(changes(after))
		.where(stillAt(id, before))
		.returning({ id: runs.id });
	if (written.length === 0) throw new RunConflict(`run ${id} moved under this request`);
}

async function datedGames(ids: number[]): Promise<Map<number, DatedGame>> {
	if (ids.length === 0) return new Map();
	const rows = await db
		.select({ id: games.id, name: games.name, year: games.year })
		.from(games)
		.where(inArray(games.id, ids));
	return new Map(rows.map((row) => [row.id, row]));
}

/**
 * The card at `position` and the timeline it goes into. A game deleted mid-run breaks the run:
 * the client's timeline would no longer match.
 */
async function cardAndTimeline(run: RunRecord, position: number) {
	const ids = run.gameIds.slice(0, position + 1);
	const found = await datedGames(ids);
	if (found.size !== new Set(ids).size) throw new RunBroken('a game of this run is gone');
	const card = found.get(run.gameIds[position])!;
	const placed = ids.slice(0, position).map((id) => found.get(id)!);
	return { card, timeline: timelineYears(placed) };
}

/** The card's image in the run's tier: its primary, or, should that have moved, any shot it has left */
async function cardAt(run: RunRecord, position: number): Promise<RunCard> {
	const [shot] = await db
		.select({ url: screenshots.url })
		.from(screenshots)
		.where(eq(screenshots.gameId, run.gameIds[position]))
		.orderBy(
			desc(sql`${screenshots.difficulty} = ${run.mode}`),
			desc(screenshots.isPrimary),
			screenshots.id
		)
		.limit(1);
	if (!shot) throw new RunBroken('a game of this run has no screenshot');
	return { id: position, screenshot: shot.url };
}

/**
 * A new run over the whole live pool of `mode`, shuffled; the server keeps the order. `deviceId`
 * is the browser's (10c): the run's score is that device's on the board
 */
export async function createRun(
	mode: Difficulty,
	deviceId: string | null = null
): Promise<RunStartResponse> {
	const pool = await selectLiveGames(mode).orderBy(sql`RANDOM()`);
	// The Pro gate, enforced here as well as on the welcome screen: a stale tab or a hand-made
	// request cannot start a Pro run on a pool too small to be one
	if (mode === 'pro' && !isProOpen(pool.length, proMinPool())) throw new ProClosed();
	if (pool.length < MIN_RUN_GAMES) throw new PoolTooSmall();

	const id = newRunId();
	const run = newRun(
		mode,
		pool.map((g) => g.id)
	);
	await db
		.insert(runs)
		.values({ id, gameIds: JSON.stringify(run.gameIds), ...changes(run), mode, deviceId });

	const [anchor, first] = pool;
	return {
		runId: id,
		mode,
		anchor: { id: 0, name: anchor.name, year: anchor.year, screenshot: anchor.screenshot },
		card: { id: 1, screenshot: first.screenshot },
		remaining: remainingAfter(run),
		lives: run.lives
	};
}

export async function placeCard(
	id: string,
	position: number,
	slot: number,
	now = Date.now()
): Promise<PlaceResponse> {
	const before = await loadRun(id);
	// Refused before the games are read; `place` checks it again
	expectStage(before, 'placing', position);
	const { card, timeline } = await cardAndTimeline(before, position);
	const out = place(before, position, slot, timeline, card, now);
	await save(id, before, out.run);

	return {
		correct: out.correct,
		insertAt: out.insertAt,
		lives: out.run.lives,
		streak: out.run.streak,
		bestStreak: out.run.bestStreak,
		livesWonBack: out.run.livesWonBack,
		lifeRegained: out.lifeRegained,
		// A miss shows where the card belongs, so its answer goes out now; a hit's waits for the bonus
		answer: out.correct ? null : { name: card.name, year: card.year },
		roundScore: out.roundScore,
		totalScore: out.run.totalScore
	};
}

export async function submitBonus(
	id: string,
	position: number,
	guess: BonusGuess,
	now = Date.now()
): Promise<BonusResponse> {
	const before = await loadRun(id);
	expectStage(before, 'bonus', position);
	const found = await datedGames([before.gameIds[position]]);
	const card = found.get(before.gameIds[position]);
	if (!card) throw new RunBroken('a game of this run is gone');

	const out = scoreBonus(before, position, guess, card, now);
	await save(id, before, out.run);
	return {
		answer: { name: card.name, year: card.year },
		roundScore: out.roundScore,
		totalScore: out.run.totalScore,
		late: out.late
	};
}

/**
 * After the card at `position`: the next card, or the end. `playerName` is the name the browser
 * holds (10c); it goes on the score if the run ends here and passes the name rules, and the
 * score is Anonymous otherwise
 */
export async function nextCard(
	id: string,
	position: number,
	playerName: unknown = null
): Promise<NextResponse> {
	const before = await loadRun(id);
	const out = advance(before, position);

	if (!out.over) {
		const card = await cardAt(out.run, out.run.position);
		await save(id, before, out.run);
		return { over: false, card, remaining: remainingAfter(out.run) };
	}

	// The end: the run is closed and its score written in one transaction. Both statements are
	// safe to race: only one update finds the row still `revealed`, and `run_id` is unique, so a
	// second insert of the same run is dropped. Every score on the board was written here.
	const r = out.run;
	await db.batch([
		db
			.update(runs)
			.set({ ...changes(r), endReason: out.endReason, finishedAt: sql`CURRENT_TIMESTAMP` })
			.where(stillAt(id, before)),
		db
			.insert(scores)
			.values({
				playerName: nameForBoard(playerName),
				totalScore: r.totalScore,
				correctPlacements: r.correct,
				wrongPlacements: r.wrong,
				bestStreak: r.bestStreak,
				difficulty: r.mode,
				runId: id,
				deviceId: sql`(SELECT ${runs.deviceId} FROM ${runs} WHERE ${runs.id} = ${id})`
			})
			.onConflictDoNothing({ target: scores.runId })
	]);

	// Where the run puts its device on the board. The score is written whatever happens here:
	// failing the answer would make the client retry a `next` that is already done
	const standing = await standingOf(id, r.mode).catch((err: unknown) => {
		console.error('standing failed:', err);
		return null;
	});
	return { over: true, endReason: out.endReason, standing };
}

const RUN_ID = /^[0-9a-f]{32}$/;

/** The run id from the URL, or a 404 for anything that cannot be one */
export function runIdParam(id: string): string {
	if (!RUN_ID.test(id)) throw new RunNotFound(id);
	return id;
}

/** A whole number from a request body, or a 400 */
export function intField(body: unknown, name: string): number {
	const value = body && typeof body === 'object' ? (body as Record<string, unknown>)[name] : null;
	if (typeof value !== 'number' || !Number.isInteger(value)) {
		throw new RangeError(`${name} must be a whole number`);
	}
	return value;
}

/**
 * How a failed run request answers. The client tells them apart: a 409 or 404 or 410 means the
 * run cannot go on (a retry would be refused again), anything else may be worth a retry.
 */
export function runErrorResponse(err: unknown): Response {
	const answer = (status: number, error: string) => Response.json({ error }, { status });
	if (err instanceof RunNotFound) return answer(404, 'run not found');
	if (err instanceof ProClosed) return answer(409, 'pro closed');
	if (err instanceof RunConflict) return answer(409, 'run is not at that card');
	if (err instanceof RunBroken) return answer(410, 'run can no longer be played');
	if (err instanceof RangeError || err instanceof SyntaxError) return answer(400, err.message);
	if (err instanceof PoolTooSmall) return answer(503, 'not enough games');
	console.error('run request failed:', err);
	return answer(503, 'database not available');
}
