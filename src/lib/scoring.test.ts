import { describe, expect, it } from 'vitest';
import {
	calculateRoundScore,
	getStreakMultiplier,
	scoreNameGuess,
	scoreYearGuess
} from './scoring';

describe('scoreYearGuess', () => {
	it('gives nothing without a guess', () => {
		expect(scoreYearGuess(null, 1998)).toBe(0);
	});

	it('gives 50 for the exact year', () => {
		expect(scoreYearGuess(1998, 1998)).toBe(50);
	});

	it('takes 10 per year off, in either direction', () => {
		expect(scoreYearGuess(1997, 1998)).toBe(40);
		expect(scoreYearGuess(1999, 1998)).toBe(40);
		expect(scoreYearGuess(2001, 1998)).toBe(20);
	});

	it('reaches 0 at five years off and never goes negative', () => {
		expect(scoreYearGuess(2003, 1998)).toBe(0);
		expect(scoreYearGuess(1950, 1998)).toBe(0);
	});
});

describe('scoreNameGuess', () => {
	const actual = 'The Legend of Zelda: Ocarina of Time';

	it('gives nothing for no guess or a blank one', () => {
		expect(scoreNameGuess(null, actual)).toBe(0);
		expect(scoreNameGuess('   ', actual)).toBe(0);
	});

	it('gives 50 for an exact match, ignoring case, punctuation and outer spaces', () => {
		expect(scoreNameGuess('the legend of zelda ocarina of time ', actual)).toBe(50);
	});

	it('gives 20 for the main title or the subtitle alone', () => {
		expect(scoreNameGuess('Ocarina of Time', actual)).toBe(20);
		expect(scoreNameGuess('The Legend of Zelda', actual)).toBe(20);
	});

	it('gives 35 for a close spelling (dice >= 0.8)', () => {
		expect(scoreNameGuess('The Legend of Zelda Ocarina of Tim', actual)).toBe(35);
	});

	it('gives 20 for a loose match (dice >= 0.5)', () => {
		expect(scoreNameGuess('Super Mario Bros', 'Super Mario World')).toBe(20);
	});

	it('gives 20 for a substring of at least 4 characters', () => {
		expect(scoreNameGuess('ocarina', actual)).toBe(20);
	});

	it('gives nothing for a short substring or an unrelated name', () => {
		expect(scoreNameGuess('of', actual)).toBe(0);
		expect(scoreNameGuess('Doom', actual)).toBe(0);
	});
});

describe('getStreakMultiplier', () => {
	it('is 1.0 up to a streak of 1', () => {
		expect(getStreakMultiplier(0)).toBe(1);
		expect(getStreakMultiplier(1)).toBe(1);
	});

	it('adds 0.1 per streak step', () => {
		expect(getStreakMultiplier(2)).toBeCloseTo(1.1);
		expect(getStreakMultiplier(4)).toBeCloseTo(1.3);
	});

	it('is capped at 1.5', () => {
		expect(getStreakMultiplier(6)).toBeCloseTo(1.5);
		expect(getStreakMultiplier(20)).toBe(1.5);
	});
});

describe('calculateRoundScore', () => {
	it('adds base, year and name bonus and applies the streak', () => {
		const score = calculateRoundScore(
			true,
			{ yearGuess: 1998, nameGuess: 'Half-Life' },
			1998,
			'Half-Life',
			3
		);
		expect(score).toMatchObject({ base: 100, yearBonus: 50, nameBonus: 50, total: 240 });
		expect(score.streakMultiplier).toBeCloseTo(1.2);
	});

	it('has no base for a wrong placement', () => {
		const score = calculateRoundScore(
			false,
			{ yearGuess: null, nameGuess: null },
			1998,
			'Half-Life',
			0
		);
		expect(score.base).toBe(0);
		expect(score.total).toBe(0);
		expect(score.placementCorrect).toBe(false);
	});

	it('rounds the total', () => {
		// (100 + 40) * 1.1 = 154.00000000000003
		const score = calculateRoundScore(
			true,
			{ yearGuess: 1997, nameGuess: null },
			1998,
			'Half-Life',
			2
		);
		expect(score.total).toBe(154);
	});
});
