import { describe, expect, it } from 'vitest';
import {
	advance,
	BONUS_SECONDS,
	BONUS_SLACK_MS,
	newRun,
	parseGuess,
	place,
	remainingAfter,
	RunConflict,
	scoreBonus,
	timelineYears,
	type RunRecord
} from './runRules';

const NOW = 1_000_000;
const DOOM = { id: 3, name: 'Doom', year: 1993 };

function run(overrides: Partial<RunRecord> = {}): RunRecord {
	return { ...newRun('normal', [1, 2, 3, 4]), ...overrides };
}

describe('newRun', () => {
	it('starts on the first card after the anchor, placing, with full lives', () => {
		const r = newRun('pro', [9, 8, 7]);
		expect(r).toMatchObject({
			mode: 'pro',
			position: 1,
			stage: 'placing',
			lives: 3,
			totalScore: 0
		});
		expect(remainingAfter(r)).toBe(1);
	});
});

describe('timelineYears', () => {
	it('sorts the placed cards by year', () => {
		expect(timelineYears([{ year: 2004 }, { year: 1985 }, { year: 1998 }])).toEqual([
			1985, 1998, 2004
		]);
	});
});

describe('place', () => {
	it('a correct slot opens the bonus window and leaves the card unrevealed', () => {
		const out = place(run(), 1, 1, [1985, 2004], DOOM, NOW);
		expect(out.correct).toBe(true);
		expect(out.insertAt).toBe(1);
		expect(out.roundScore).toBeNull();
		expect(out.run).toMatchObject({ stage: 'bonus', streak: 1, correct: 1, lives: 3 });
		expect(out.run.bonusDeadline).toBe(NOW + BONUS_SECONDS * 1000 + BONUS_SLACK_MS);
	});

	it('a wrong slot costs a life, inserts the card where it belongs and is revealed at once', () => {
		const out = place(run({ streak: 4 }), 1, 0, [1985, 2004], DOOM, NOW);
		expect(out.correct).toBe(false);
		expect(out.insertAt).toBe(1);
		expect(out.run).toMatchObject({ stage: 'revealed', streak: 0, wrong: 1, lives: 2 });
		expect(out.run.bonusDeadline).toBeNull();
		expect(out.roundScore).toMatchObject({ total: 0, actualName: 'Doom', actualYear: 1993 });
	});

	it('marks each placed card: o a hit, x a miss', () => {
		const hit = place(run({ marks: 'x' }), 1, 1, [1985, 2004], DOOM, NOW);
		expect(hit.run.marks).toBe('xo');
		const miss = place(run({ marks: 'o' }), 1, 0, [1985, 2004], DOOM, NOW);
		expect(miss.run.marks).toBe('ox');
	});

	it('the tenth in a row gives a life back', () => {
		const out = place(run({ streak: 9, lives: 2 }), 1, 1, [1985, 2004], DOOM, NOW);
		expect(out.lifeRegained).toBe(true);
		expect(out.run.lives).toBe(3);
	});

	it('refuses a second placement of the same card (double tap, retry)', () => {
		const first = place(run(), 1, 1, [1985, 2004], DOOM, NOW).run;
		expect(() => place(first, 1, 1, [1985, 2004], DOOM, NOW)).toThrow(RunConflict);
	});

	it('refuses a request about another card', () => {
		expect(() => place(run(), 2, 1, [1985, 2004], DOOM, NOW)).toThrow(RunConflict);
	});

	it('refuses a slot outside the timeline', () => {
		expect(() => place(run(), 1, 3, [1985, 2004], DOOM, NOW)).toThrow(RangeError);
		expect(() => place(run(), 1, -1, [1985, 2004], DOOM, NOW)).toThrow(RangeError);
		expect(() => place(run(), 1, 0.5, [1985, 2004], DOOM, NOW)).toThrow(RangeError);
	});
});

describe('scoreBonus', () => {
	const placed = place(run(), 1, 1, [1985, 2004], DOOM, NOW).run;

	it('scores a guess inside the window, with the streak after the placement', () => {
		const out = scoreBonus(placed, 1, { yearGuess: 1993, nameGuess: 'doom' }, DOOM, NOW + 10_000);
		expect(out.late).toBe(false);
		expect(out.roundScore).toMatchObject({ base: 100, yearBonus: 50, nameBonus: 50, total: 200 });
		expect(out.run).toMatchObject({ stage: 'revealed', totalScore: 200, bonusDeadline: null });
	});

	it('scores a guess past the deadline as skipped, keeping the placement', () => {
		const late = placed.bonusDeadline! + 1;
		const out = scoreBonus(placed, 1, { yearGuess: 1993, nameGuess: 'Doom' }, DOOM, late);
		expect(out.late).toBe(true);
		expect(out.roundScore).toMatchObject({ base: 100, yearBonus: 0, nameBonus: 0, total: 100 });
	});

	it('accepts a guess right at the deadline', () => {
		const out = scoreBonus(
			placed,
			1,
			{ yearGuess: 1993, nameGuess: null },
			DOOM,
			placed.bonusDeadline!
		);
		expect(out.late).toBe(false);
	});

	it('refuses a second bonus for the same card', () => {
		const once = scoreBonus(placed, 1, { yearGuess: null, nameGuess: null }, DOOM, NOW).run;
		expect(() => scoreBonus(once, 1, { yearGuess: 1993, nameGuess: null }, DOOM, NOW)).toThrow(
			RunConflict
		);
	});

	it('refuses a bonus after a miss', () => {
		const missed = place(run(), 1, 0, [1985, 2004], DOOM, NOW).run;
		expect(() => scoreBonus(missed, 1, { yearGuess: 1993, nameGuess: null }, DOOM, NOW)).toThrow(
			RunConflict
		);
	});

	it('scores Pro strictly', () => {
		const pro = place(run({ mode: 'pro' }), 1, 1, [1985, 2004], DOOM, NOW).run;
		const out = scoreBonus(pro, 1, { yearGuess: 1995, nameGuess: null }, DOOM, NOW);
		expect(out.roundScore.yearBonus).toBe(0);
	});
});

describe('advance', () => {
	it('hands out the next card', () => {
		const out = advance(run({ stage: 'revealed' }), 1);
		expect(out.over).toBe(false);
		expect(out.run).toMatchObject({ stage: 'placing', position: 2 });
	});

	it('ends the run at no lives', () => {
		const out = advance(run({ stage: 'revealed', lives: 0 }), 1);
		expect(out).toMatchObject({ over: true, endReason: 'outOfLives', run: { stage: 'over' } });
	});

	it('ends the run when the pool is cleared', () => {
		const out = advance(run({ stage: 'revealed', position: 3 }), 3);
		expect(out).toMatchObject({ over: true, endReason: 'poolCleared' });
	});

	it('refuses while the bonus window is open', () => {
		expect(() => advance(run({ stage: 'bonus' }), 1)).toThrow(RunConflict);
	});

	it('refuses a run that is over', () => {
		expect(() => advance(run({ stage: 'over' }), 1)).toThrow(RunConflict);
	});
});

describe('parseGuess', () => {
	it('keeps a whole year and a trimmed name', () => {
		expect(parseGuess({ yearGuess: 1993, nameGuess: '  Doom ' })).toEqual({
			yearGuess: 1993,
			nameGuess: 'Doom'
		});
	});

	it('drops anything that is not a guess', () => {
		expect(parseGuess({ yearGuess: '1993', nameGuess: 42 })).toEqual({
			yearGuess: null,
			nameGuess: null
		});
		expect(parseGuess({ yearGuess: 19.5, nameGuess: '   ' })).toEqual({
			yearGuess: null,
			nameGuess: null
		});
		expect(parseGuess({})).toEqual({ yearGuess: null, nameGuess: null });
	});

	it('cuts a very long name', () => {
		expect(parseGuess({ nameGuess: 'x'.repeat(500) }).nameGuess).toHaveLength(100);
	});
});
