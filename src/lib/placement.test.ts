import { describe, expect, it } from 'vitest';
import {
	applyPlacement,
	decadeBuckets,
	rowDecades,
	findCorrectIndex,
	ghostSlotIndex,
	hudMoment,
	isPerfectRun,
	isPlacementCorrect,
	regainsLife,
	runOutcome,
	streakMeter
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

describe('streakMeter', () => {
	const current = (streak: number) =>
		streakMeter(streak, 3, 3).steps.find((step) => step.current)?.value;

	it('shows the multiplier the next correct placement earns', () => {
		expect(streakMeter(0, 3, 3).multiplier).toBe(1.0);
		expect(streakMeter(1, 3, 3).multiplier).toBeCloseTo(1.1);
		expect(streakMeter(5, 3, 3).multiplier).toBe(1.5);
		expect(streakMeter(6, 3, 3).multiplier).toBe(1.5);
	});

	it('has a ladder of six steps, ×1.0 to ×1.5', () => {
		expect(streakMeter(0, 3, 3).steps.map((step) => step.value)).toEqual([
			1.0, 1.1, 1.2, 1.3, 1.4, 1.5
		]);
	});

	it('marks the step the next card earns, and lights every step up to it', () => {
		expect(current(0)).toBe(1.0);
		expect(current(1)).toBe(1.1);
		expect(current(4)).toBe(1.4);
		expect(current(5)).toBe(1.5);
		expect(current(20)).toBe(1.5);
		const steps = streakMeter(3, 3, 3).steps;
		expect(steps.filter((step) => step.lit).map((step) => step.value)).toEqual([
			1.0, 1.1, 1.2, 1.3
		]);
		expect(steps.filter((step) => step.current)).toHaveLength(1);
	});

	it('drops back to the bottom step after a miss', () => {
		const steps = streakMeter(0, 2, 3).steps;
		expect(steps.filter((step) => step.lit)).toHaveLength(1);
		expect(steps[0]).toMatchObject({ lit: true, current: true });
	});

	it('charges a heart only while a life is missing, one tenth per card in a row', () => {
		expect(streakMeter(7, 3, 3)).toMatchObject({ charge: null, toNextLife: null });
		expect(streakMeter(7, 2, 3)).toMatchObject({ charge: 7, toNextLife: 3 });
		expect(streakMeter(0, 1, 3)).toMatchObject({ charge: 0, toNextLife: 10 });
		expect(streakMeter(9, 2, 3)).toMatchObject({ charge: 9, toNextLife: 1 });
		// The 10th in a row gave the life back; with one still missing the next heart starts empty
		expect(streakMeter(10, 2, 3)).toMatchObject({ charge: 0, toNextLife: 10 });
		expect(streakMeter(11, 2, 3)).toMatchObject({ charge: 1, toNextLife: 9 });
		expect(streakMeter(20, 3, 3)).toMatchObject({ charge: null, toNextLife: null });
	});
});

describe('hudMoment', () => {
	it('is quiet while no placement is on show, and after a plain correct one', () => {
		expect(hudMoment(null, 0, false)).toBe('none');
		expect(hudMoment(true, 7, false)).toBe('none');
	});

	it('marks a wrong placement', () => {
		expect(hudMoment(false, 0, false)).toBe('wrong');
	});

	it('tells a life won back from ten in a row with lives full', () => {
		expect(hudMoment(true, 10, true)).toBe('lifeBack');
		expect(hudMoment(true, 10, false)).toBe('tenInARow');
		expect(hudMoment(true, 20, false)).toBe('tenInARow');
		expect(hudMoment(true, 11, false)).toBe('none');
	});
});

describe('decadeBuckets', () => {
	it('is empty for an empty timeline', () => {
		expect(decadeBuckets([])).toEqual([]);
	});

	it('groups a sorted timeline into decades with their first index', () => {
		expect(decadeBuckets(timeline(1985, 1989, 1990, 1996, 1999, 2004, 2020))).toEqual([
			{ decade: 1980, count: 2, firstIndex: 0 },
			{ decade: 1990, count: 3, firstIndex: 2 },
			{ decade: 2000, count: 1, firstIndex: 5 },
			{ decade: 2020, count: 1, firstIndex: 6 }
		]);
	});

	it('puts a year ending in 0 at the start of its decade, and skips empty decades', () => {
		expect(decadeBuckets(timeline(2009, 2010, 2030))).toEqual([
			{ decade: 2000, count: 1, firstIndex: 0 },
			{ decade: 2010, count: 1, firstIndex: 1 },
			{ decade: 2030, count: 1, firstIndex: 2 }
		]);
	});

	// The feedback of 2026-10-02: 2011, 2011, ????, 2023 showed "2020s" above the hidden card
	it('counts a hidden card in the decade of the card before it', () => {
		expect(decadeBuckets(timeline(2011, 2011, 2022, 2023), 2)).toEqual([
			{ decade: 2010, count: 3, firstIndex: 0 },
			{ decade: 2020, count: 1, firstIndex: 3 }
		]);
	});

	it('counts a hidden first card in the decade of the card after it', () => {
		expect(decadeBuckets(timeline(1985, 1992), 0)).toEqual([
			{ decade: 1990, count: 2, firstIndex: 0 }
		]);
	});
});

describe('rowDecades', () => {
	it('gives every row its own decade when nothing is hidden', () => {
		expect(rowDecades(timeline(1988, 1994))).toEqual([1980, 1990]);
	});

	it('gives a hidden card the decade of its neighbour', () => {
		expect(rowDecades(timeline(1988, 1992, 1994), 1)).toEqual([1980, 1980, 1990]);
	});
});

describe('ghostSlotIndex', () => {
	// [1996, 2002] + Portal (2007): the right place is index 2
	it('keeps a chosen slot before the insertion point', () => {
		expect(ghostSlotIndex(0, 2)).toBe(0);
		expect(ghostSlotIndex(1, 2)).toBe(1);
	});

	// [2002, 2013] + Super Mario 64 (1996), inserted at 0: the slots after it moved down by one
	it('moves a chosen slot after the insertion point down by one', () => {
		expect(ghostSlotIndex(1, 0)).toBe(2);
		expect(ghostSlotIndex(2, 0)).toBe(3);
	});

	it('marks a real slot of the new timeline, never the card itself', () => {
		const before = timeline(1996, 2002, 2013);
		for (let chosen = 0; chosen <= before.length; chosen++) {
			for (let at = 0; at <= before.length; at++) {
				if (chosen === at) continue;
				const ghost = ghostSlotIndex(chosen, at);
				expect(ghost).toBeGreaterThanOrEqual(0);
				expect(ghost).toBeLessThanOrEqual(before.length + 1);
				// Slot `at` and `at + 1` sit directly around the card: a wrong choice is never one of them
				expect([at, at + 1]).not.toContain(ghost);
			}
		}
	});
});
