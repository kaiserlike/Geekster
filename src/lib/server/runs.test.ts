// The referee's guarantees, against a real database with the real migrations (`testDb.ts`):
// what `runRules.test.ts` proves for one request, this file proves for the conditional writes,
// the unique indexes and the races between two requests.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { count, eq } from 'drizzle-orm';
import { PRO_MIN_POOL } from '$lib/modes';
import { PLACEMENT_POINTS } from '$lib/scoring';
import { BONUS_SECONDS, BONUS_SLACK_MS } from './runRules';
import { runs, scores } from './schema';
import {
	db,
	freshDb,
	normalGames,
	runRow,
	seedGames,
	type GameSpec,
	type SeededGame
} from './testDb';
import {
	createRun,
	DailyPlayed,
	nextCard,
	placeCard,
	ProClosed,
	RunConflict,
	submitBonus
} from './runs';

vi.mock('./db', () => import('./testDb'));
// No `PRO_MIN_POOL_OVERRIDE` from a local `.env`: the gate is the production one
vi.mock('$env/dynamic/private', () => ({ env: {} }));

const NOW = new Date('2026-10-07T12:00:00Z');
const T = NOW.getTime();
const DEADLINE = T + BONUS_SECONDS * 1000 + BONUS_SLACK_MS;

let seeded: Map<number, SeededGame>;

async function seed(specs: GameSpec[]): Promise<void> {
	seeded = await seedGames(specs);
}

beforeEach(async () => {
	await freshDb();
});

/** The slot that places the run's card at `position` right, or one that places it wrong */
async function slotFor(runId: string, position: number, correct: boolean): Promise<number> {
	const order = JSON.parse((await runRow(runId)).gameIds) as number[];
	const year = (id: number) => seeded.get(id)!.year;
	const timeline = order
		.slice(0, position)
		.map(year)
		.sort((a, b) => a - b);
	const right = timeline.filter((y) => y < year(order[position])).length;
	if (correct) return right;
	return right === 0 ? timeline.length : 0;
}

async function play(runId: string, position: number, correct: boolean, now = T) {
	return placeCard(runId, position, await slotFor(runId, position, correct), now);
}

/** A miss with its consolation skipped: the card is revealed, waiting for `next` */
async function miss(runId: string, position: number): Promise<void> {
	await play(runId, position, false);
	await submitBonus(runId, position, { yearGuess: null, nameGuess: null }, T);
}

/** The game dealt at `position` of the run */
async function cardOf(runId: string, position: number): Promise<SeededGame> {
	return seeded.get((JSON.parse((await runRow(runId)).gameIds) as number[])[position])!;
}

/** Three misses in a row: the run is over after the third card's `next` */
async function loseRun(runId: string): Promise<void> {
	for (const position of [1, 2, 3]) {
		await miss(runId, position);
		if (position < 3) await nextCard(runId, position);
	}
}

async function scoresOf(runId: string): Promise<number> {
	const [row] = await db.select({ n: count() }).from(scores).where(eq(scores.runId, runId));
	return row.n;
}

describe('createRun', () => {
	it('deals every live game of the mode and nothing else', async () => {
		await seed([
			...normalGames(5),
			{ name: 'Draft', year: 1999, published: false },
			{ name: 'Pro only', year: 2001, tiers: ['pro'] }
		]);
		const start = await createRun('normal', 'device-a', NOW);
		const order = JSON.parse((await runRow(start.runId)).gameIds) as number[];

		const live = [...seeded.values()].filter((g) => g.name.startsWith('Game')).map((g) => g.id);
		expect([...order].sort()).toEqual([...live].sort());
		expect(start.remaining).toBe(3);
	});

	it('refuses Pro one game below the gate and writes no run', async () => {
		await seed(normalGames(PRO_MIN_POOL - 1, ['normal', 'pro']));
		await expect(createRun('pro', 'device-a', NOW)).rejects.toThrow(ProClosed);
		const [row] = await db.select({ n: count() }).from(runs);
		expect(row.n).toBe(0);
	});

	it('starts Pro at exactly the gate', async () => {
		await seed(normalGames(PRO_MIN_POOL, ['normal', 'pro']));
		const start = await createRun('pro', 'device-a', NOW);
		expect(start.mode).toBe('pro');
		expect(start.card.screenshot).toMatch(/-pro\.webp$/);
	});
});

describe('covers', () => {
	it('no answer of the referee carries a cover, to the end of the run', async () => {
		await seed(
			normalGames(4).map((game, i) => ({ ...game, cover: `https://blob.test/cover-${i}.webp` }))
		);
		const answers: unknown[] = [];
		const start = await createRun('normal', 'device-a', NOW);
		answers.push(start);
		for (const position of [1, 2, 3]) {
			answers.push(await play(start.runId, position, true));
			answers.push(
				await submitBonus(start.runId, position, { yearGuess: null, nameGuess: null }, T)
			);
			answers.push(await nextCard(start.runId, position));
		}
		expect(JSON.stringify(answers)).not.toContain('cover');
	});
});

describe('placeCard', () => {
	beforeEach(async () => {
		await seed(normalGames(6));
	});

	it('refuses a second place for the same card', async () => {
		const { runId } = await createRun('normal', 'device-a', NOW);
		await play(runId, 1, true);
		await expect(play(runId, 1, true)).rejects.toThrow(RunConflict);
	});

	it('applies one of two places racing for the same card and refuses the other', async () => {
		const { runId } = await createRun('normal', 'device-a', NOW);
		const slot = await slotFor(runId, 1, false);
		const results = await Promise.allSettled([
			placeCard(runId, 1, slot, T),
			placeCard(runId, 1, slot, T)
		]);

		expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
		const refused = results.find((r) => r.status === 'rejected');
		expect(refused?.reason).toBeInstanceOf(RunConflict);
		const row = await runRow(runId);
		expect({ wrong: row.wrong, lives: row.lives, marks: row.marks }).toEqual({
			wrong: 1,
			lives: 2,
			marks: 'x'
		});
	});

	it('gives a miss its year at once and holds every name back for the bonus', async () => {
		const { runId } = await createRun('normal', 'device-a', NOW);
		const hit = await play(runId, 1, true);
		expect(hit.year).toBeNull();

		await submitBonus(runId, 1, { yearGuess: null, nameGuess: null }, T);
		await nextCard(runId, 1);
		const missed = await play(runId, 2, false);
		const card = await cardOf(runId, 2);
		expect(missed.year).toBe(card.year);
		expect(JSON.stringify(missed)).not.toContain(card.name);
		expect(await runRow(runId)).toMatchObject({ stage: 'bonus', position: 2 });
	});
});

describe('submitBonus', () => {
	beforeEach(async () => {
		await seed(normalGames(6));
	});

	async function bonusAt(now: number) {
		const { runId } = await createRun('normal', 'device-a', NOW);
		await play(runId, 1, true);
		const card = seeded.get((JSON.parse((await runRow(runId)).gameIds) as number[])[1])!;
		const out = await submitBonus(runId, 1, { yearGuess: card.year, nameGuess: card.name }, now);
		return { runId, out };
	}

	it('scores a guess that arrives exactly at the deadline', async () => {
		const { out } = await bonusAt(DEADLINE);
		expect(out.late).toBe(false);
		expect(out.roundScore.yearBonus).toBeGreaterThan(0);
		expect(out.roundScore.nameBonus).toBeGreaterThan(0);
	});

	it('scores a guess one millisecond late as skipped', async () => {
		const { runId, out } = await bonusAt(DEADLINE + 1);
		expect(out.late).toBe(true);
		expect(out.roundScore).toMatchObject({ yearBonus: 0, nameBonus: 0 });
		expect((await runRow(runId)).totalScore).toBe(out.roundScore.base);
	});

	it('refuses a second bonus for the same card', async () => {
		const { runId } = await bonusAt(T);
		const guess = { yearGuess: 1980, nameGuess: 'Game 1' };
		await expect(submitBonus(runId, 1, guess, T)).rejects.toThrow(RunConflict);
	});

	it('scores the consolation after a miss: the name at half, the year ignored', async () => {
		const { runId } = await createRun('normal', 'device-a', NOW);
		await play(runId, 1, false);
		const card = await cardOf(runId, 1);
		const out = await submitBonus(runId, 1, { yearGuess: card.year, nameGuess: card.name }, T);

		expect(out.answer).toEqual({ name: card.name, year: card.year });
		expect(out.roundScore).toMatchObject({ base: 0, yearBonus: 0, nameBonus: 25, total: 25 });
		expect(out).toMatchObject({ totalScore: 25, namesKnown: 1, exactYears: 0 });
		expect(await runRow(runId)).toMatchObject({
			stage: 'revealed',
			totalScore: 25,
			namesKnown: 1,
			exactYears: 0
		});
	});

	it('scores one of two consolations racing for the same card and refuses the other', async () => {
		const { runId } = await createRun('normal', 'device-a', NOW);
		await play(runId, 1, false);
		const guess = { yearGuess: null, nameGuess: (await cardOf(runId, 1)).name };
		const results = await Promise.allSettled([
			submitBonus(runId, 1, guess, T),
			submitBonus(runId, 1, guess, T)
		]);

		expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
		const refused = results.find((r) => r.status === 'rejected');
		expect(refused?.reason).toBeInstanceOf(RunConflict);
		expect(await runRow(runId)).toMatchObject({ totalScore: 25, namesKnown: 1 });
	});

	it('keeps the tally of names known and years exact across the run', async () => {
		const { runId } = await createRun('normal', 'device-a', NOW);
		await play(runId, 1, true);
		const first = await cardOf(runId, 1);
		await submitBonus(runId, 1, { yearGuess: first.year, nameGuess: first.name }, T);
		await nextCard(runId, 1);
		await play(runId, 2, true);
		const second = await cardOf(runId, 2);
		const out = await submitBonus(runId, 2, { yearGuess: second.year + 1, nameGuess: 'zzzz' }, T);

		expect(out).toMatchObject({ namesKnown: 1, exactYears: 1 });
	});
});

describe('nextCard', () => {
	beforeEach(async () => {
		await seed(normalGames(6));
	});

	it('refuses a second next for the same card', async () => {
		const { runId } = await createRun('normal', 'device-a', NOW);
		await miss(runId, 1);
		await nextCard(runId, 1);
		await expect(nextCard(runId, 1)).rejects.toThrow(RunConflict);
	});

	it('writes exactly one score at the end, even when the last next arrives twice', async () => {
		const { runId } = await createRun('normal', 'device-a', NOW);
		await loseRun(runId);
		const results = await Promise.allSettled([nextCard(runId, 3), nextCard(runId, 3)]);

		// The loser either sees the end too or is told the run moved on; never a database error,
		// which the client would answer with a retry
		expect(results[0]).toMatchObject({ status: 'fulfilled', value: { over: true } });
		for (const result of results) {
			if (result.status === 'fulfilled') expect(result.value.over).toBe(true);
			else expect(result.reason).toBeInstanceOf(RunConflict);
		}
		expect(await scoresOf(runId)).toBe(1);
		const row = await runRow(runId);
		expect(row).toMatchObject({ stage: 'over', endReason: 'outOfLives' });
		expect(row.finishedAt).not.toBeNull();
	});

	it('ends with the pool cleared after the last card', async () => {
		await freshDb();
		await seed(normalGames(3));
		const { runId } = await createRun('normal', 'device-a', NOW);
		await play(runId, 1, true);
		await submitBonus(runId, 1, { yearGuess: null, nameGuess: null }, T);
		await nextCard(runId, 1);
		await miss(runId, 2);
		const end = await nextCard(runId, 2, 'Ada');

		expect(end).toMatchObject({ over: true, endReason: 'poolCleared', marks: 'ox' });
		const [score] = await db.select().from(scores).where(eq(scores.runId, runId));
		expect(score).toMatchObject({ playerName: 'Ada', correctPlacements: 1, wrongPlacements: 1 });
	});
});

describe('the Daily Run', () => {
	beforeEach(async () => {
		await seed(normalGames(24));
	});

	it('needs a device id', async () => {
		await expect(createRun('daily', null, NOW)).rejects.toThrow(RangeError);
	});

	it('deals every device the same set', async () => {
		const a = await createRun('daily', 'device-a', NOW);
		const b = await createRun('daily', 'device-b', NOW);
		expect(a.runId).not.toBe(b.runId);
		expect((await runRow(a.runId)).gameIds).toBe((await runRow(b.runId)).gameIds);
		expect(a.daily).toEqual({ number: 1, date: '2026-10-07' });
	});

	it('resumes an unfinished Daily where it was left', async () => {
		const first = await createRun('daily', 'device-a', NOW);
		await play(first.runId, 1, false);
		const card = await cardOf(first.runId, 1);
		await submitBonus(first.runId, 1, { yearGuess: null, nameGuess: card.name }, T);
		await nextCard(first.runId, 1);

		const again = await createRun('daily', 'device-a', NOW);
		expect(again.runId).toBe(first.runId);
		expect(again.card.id).toBe(2);
		expect(again.lives).toBe(2);
		expect(again.resume).toMatchObject({ wrong: 1, missedIds: [1], marks: 'x', namesKnown: 1 });
		expect(again.resume?.timeline).toHaveLength(2);
	});

	it('scores a bonus left open as skipped when the Daily resumes', async () => {
		const { runId } = await createRun('daily', 'device-a', NOW);
		await play(runId, 1, true);

		const again = await createRun('daily', 'device-a', new Date(DEADLINE + 60_000));
		expect(again.card.id).toBe(2);
		expect(again.resume).toMatchObject({ correct: 1, totalScore: PLACEMENT_POINTS });
		expect(await runRow(runId)).toMatchObject({ stage: 'placing', position: 2 });
	});

	it('scores a consolation left open as skipped when the Daily resumes', async () => {
		const { runId } = await createRun('daily', 'device-a', NOW);
		await play(runId, 1, false);

		const again = await createRun('daily', 'device-a', new Date(DEADLINE + 60_000));
		expect(again.card.id).toBe(2);
		expect(again.resume).toMatchObject({ wrong: 1, totalScore: 0, namesKnown: 0 });
	});

	it('gives two tabs starting the same Daily one run', async () => {
		const [a, b] = await Promise.all([
			createRun('daily', 'device-a', NOW),
			createRun('daily', 'device-a', NOW)
		]);
		expect(a.runId).toBe(b.runId);
		const [row] = await db.select({ n: count() }).from(runs);
		expect(row.n).toBe(1);
	});

	it('refuses a finished Daily for the rest of the day, and deals a new one the next', async () => {
		const { runId } = await createRun('daily', 'device-a', NOW);
		await loseRun(runId);
		await nextCard(runId, 3);
		expect(await scoresOf(runId)).toBe(1);

		const lastMinute = new Date('2026-10-07T23:59:59Z');
		await expect(createRun('daily', 'device-a', lastMinute)).rejects.toThrow(DailyPlayed);
		const tomorrow = await createRun('daily', 'device-a', new Date('2026-10-08T00:00:00Z'));
		expect(tomorrow.daily).toEqual({ number: 2, date: '2026-10-08' });
	});
});
