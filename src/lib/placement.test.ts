import { describe, expect, it } from 'vitest';
import {
	applyPlacement,
	findCorrectIndex,
	isPerfectRun,
	isPlacementCorrect,
	regainsLife,
	runOutcome
} from './placement';

const timeline = (...years: number[]) => years.map((year) => ({ year }));

describe('isPlacementCorrect', () => {
	it('accepts either side of a lone anchor when the year fits', () => {
		const anchor = timeline(2000);
		expect(isPlacementCorrect(anchor, 1990, 0)).toBe(true);
		expect(isPlacementCorrect(anchor, 2010, 1)).toBe(true);
		expect(isPlacementCorrect(anchor, 2010, 0)).toBe(false);
		expect(isPlacementCorrect(anchor, 1990, 1)).toBe(false);
	});

	it('checks the first slot against the first card only', () => {
		const line = timeline(1990, 2000, 2010);
		expect(isPlacementCorrect(line, 1985, 0)).toBe(true);
		expect(isPlacementCorrect(line, 1995, 0)).toBe(false);
	});

	it('checks the last slot against the last card only', () => {
		const line = timeline(1990, 2000, 2010);
		expect(isPlacementCorrect(line, 2015, 3)).toBe(true);
		expect(isPlacementCorrect(line, 2005, 3)).toBe(false);
	});

	it('checks a middle slot against both neighbours', () => {
		const line = timeline(1990, 2000, 2010);
		expect(isPlacementCorrect(line, 2005, 2)).toBe(true);
		expect(isPlacementCorrect(line, 1995, 2)).toBe(false);
		expect(isPlacementCorrect(line, 2012, 2)).toBe(false);
	});

	it('treats an equal year as correct on either side', () => {
		const line = timeline(1990, 2000, 2010);
		expect(isPlacementCorrect(line, 2000, 1)).toBe(true);
		expect(isPlacementCorrect(line, 2000, 2)).toBe(true);
		expect(isPlacementCorrect(line, 1990, 0)).toBe(true);
		expect(isPlacementCorrect(line, 2010, 3)).toBe(true);
	});

	it('accepts any slot inside a run of equal years', () => {
		const line = timeline(1990, 2000, 2000, 2000, 2010);
		for (const slot of [1, 2, 3, 4]) {
			expect(isPlacementCorrect(line, 2000, slot)).toBe(true);
		}
		expect(isPlacementCorrect(line, 2000, 0)).toBe(false);
		expect(isPlacementCorrect(line, 2000, 5)).toBe(false);
	});
});

describe('findCorrectIndex', () => {
	const line = timeline(1990, 2000, 2000, 2010);

	it('puts an earlier year first', () => {
		expect(findCorrectIndex(line, 1980)).toBe(0);
	});

	it('puts a later year last', () => {
		expect(findCorrectIndex(line, 2020)).toBe(4);
	});

	it('puts a year between its neighbours', () => {
		expect(findCorrectIndex(line, 2005)).toBe(3);
	});

	it('puts an equal year before the first card of that year', () => {
		expect(findCorrectIndex(line, 2000)).toBe(1);
	});

	it('always lands on a slot isPlacementCorrect accepts', () => {
		for (const year of [1980, 1990, 1995, 2000, 2005, 2010, 2020]) {
			expect(isPlacementCorrect(line, year, findCorrectIndex(line, year))).toBe(true);
		}
	});
});

describe('regainsLife', () => {
	it('gives a life back at a streak of 10 when below the maximum', () => {
		expect(regainsLife(10, 2, 3)).toBe(true);
		expect(regainsLife(10, 1, 3)).toBe(true);
	});

	it('gives nothing at full lives', () => {
		expect(regainsLife(10, 3, 3)).toBe(false);
		expect(regainsLife(20, 3, 3)).toBe(false);
	});

	it('gives a life back at every multiple of 10', () => {
		expect(regainsLife(20, 1, 3)).toBe(true);
		expect(regainsLife(30, 2, 3)).toBe(true);
	});

	it('gives nothing between multiples, or before the first streak', () => {
		for (const streak of [0, 1, 9, 11, 19, 21]) {
			expect(regainsLife(streak, 1, 3)).toBe(false);
		}
	});
});

describe('runOutcome', () => {
	it('continues while there are lives and games left', () => {
		expect(runOutcome(3, 50)).toBeNull();
		expect(runOutcome(1, 1)).toBeNull();
	});

	it('ends out of lives at 0, even when the pool ran out on the same card', () => {
		expect(runOutcome(0, 10)).toBe('outOfLives');
		expect(runOutcome(0, 0)).toBe('outOfLives');
	});

	it('ends with a cleared pool when games run out with lives left', () => {
		expect(runOutcome(1, 0)).toBe('poolCleared');
		expect(runOutcome(3, 0)).toBe('poolCleared');
	});
});

describe('isPerfectRun', () => {
	it('is a cleared pool without a single wrong placement', () => {
		expect(isPerfectRun('poolCleared', 0)).toBe(true);
	});

	it('is not perfect after a mistake, even with the pool cleared', () => {
		expect(isPerfectRun('poolCleared', 1)).toBe(false);
	});

	it('is never perfect when the run ended out of lives', () => {
		expect(isPerfectRun('outOfLives', 0)).toBe(false);
		expect(isPerfectRun(null, 0)).toBe(false);
	});
});

describe('applyPlacement', () => {
	const fresh = { lives: 3, maxLives: 3, streak: 0, bestStreak: 0, livesWonBack: 0 };

	it('counts a correct placement into the streak and the best streak', () => {
		expect(applyPlacement(fresh, true)).toEqual({
			...fresh,
			streak: 1,
			bestStreak: 1,
			lifeRegained: false
		});
	});

	it('takes a life and resets the streak on a wrong placement, keeping the best streak', () => {
		const next = applyPlacement({ ...fresh, streak: 7, bestStreak: 7 }, false);
		expect(next).toMatchObject({ lives: 2, streak: 0, bestStreak: 7, lifeRegained: false });
	});

	it('gives the life back on the 10th correct card in a row, not the 11th', () => {
		let run = { ...fresh, lives: 2 };
		for (let i = 1; i <= 9; i++) {
			const next = applyPlacement(run, true);
			expect(next.lifeRegained).toBe(false);
			run = next;
		}
		const tenth = applyPlacement(run, true);
		expect(tenth).toMatchObject({ streak: 10, lives: 3, livesWonBack: 1, lifeRegained: true });
		expect(applyPlacement(tenth, true)).toMatchObject({
			lives: 3,
			livesWonBack: 1,
			lifeRegained: false
		});
	});

	it('gives nothing at a streak of 10 with full lives', () => {
		const next = applyPlacement({ ...fresh, streak: 9, bestStreak: 9 }, true);
		expect(next).toMatchObject({ streak: 10, lives: 3, livesWonBack: 0, lifeRegained: false });
	});

	it('never regains on a wrong placement', () => {
		const next = applyPlacement({ ...fresh, lives: 2, streak: 9, bestStreak: 9 }, false);
		expect(next).toMatchObject({ lives: 1, streak: 0, livesWonBack: 0, lifeRegained: false });
	});
});
