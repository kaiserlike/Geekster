import { describe, expect, it } from 'vitest';
import {
	calculateRoundScore,
	roundTally,
	scoreConsolationName,
	getStreakMultiplier,
	PLACEMENT_POINTS,
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

	// Decision 2 (2026-09-27): Normal pays only up to three years off.
	it('gives 30, 20 and 10 for one, two and three years off, in either direction', () => {
		expect(scoreYearGuess(1997, 1998)).toBe(30);
		expect(scoreYearGuess(1999, 1998)).toBe(30);
		expect(scoreYearGuess(2000, 1998)).toBe(20);
		expect(scoreYearGuess(1995, 1998)).toBe(10);
	});

	it('reaches 0 at four years off and never goes negative', () => {
		expect(scoreYearGuess(2002, 1998)).toBe(0);
		expect(scoreYearGuess(1950, 1998)).toBe(0);
	});

	it('is the same when Normal is passed explicitly', () => {
		expect(scoreYearGuess(1997, 1998, 'normal')).toBe(30);
	});
});

describe('scoreYearGuess in Pro', () => {
	it('gives 50 for the exact year', () => {
		expect(scoreYearGuess(1998, 1998, 'pro')).toBe(50);
	});

	it('gives 25 for one year off, in either direction', () => {
		expect(scoreYearGuess(1997, 1998, 'pro')).toBe(25);
		expect(scoreYearGuess(1999, 1998, 'pro')).toBe(25);
	});

	it('gives nothing from two years off, or without a guess', () => {
		expect(scoreYearGuess(2000, 1998, 'pro')).toBe(0);
		expect(scoreYearGuess(1950, 1998, 'pro')).toBe(0);
		expect(scoreYearGuess(null, 1998, 'pro')).toBe(0);
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

// Decision 2 (2026-09-27): a wrong accent, apostrophe or hyphen is still the exact title.
describe('scoreNameGuess — what still counts as exact', () => {
	it('ignores accents and other diacritics', () => {
		expect(scoreNameGuess('ghost of yotei', 'Ghost of Yōtei')).toBe(50);
		expect(scoreNameGuess('Pokemon Red', 'Pokémon Red')).toBe(50);
		expect(scoreNameGuess('Ghost of Yōtei', 'Ghost of Yotei')).toBe(50);
	});

	it('ignores apostrophes, whichever kind', () => {
		expect(scoreNameGuess('Baldurs Gate 3', "Baldur's Gate 3")).toBe(50);
		expect(scoreNameGuess('Mirror’s Edge', "Mirror's Edge")).toBe(50);
	});

	it('ignores a hyphen or a space that is there or not', () => {
		expect(scoreNameGuess('pac man', 'Pac-Man')).toBe(50);
		expect(scoreNameGuess('Halflife 2', 'Half-Life 2')).toBe(50);
		expect(scoreNameGuess('counter strike', 'Counter-Strike')).toBe(50);
	});

	it('ignores a disambiguating parenthesis at the end of the title', () => {
		expect(scoreNameGuess('Doom', 'Doom (2016)')).toBe(50);
		expect(scoreNameGuess('Doom 2016', 'Doom (2016)')).toBe(50);
	});

	it('still tells different games apart', () => {
		expect(scoreNameGuess('Half-Life', 'Half-Life 2')).not.toBe(50);
		expect(scoreNameGuess('Baldurs Gate', "Baldur's Gate 3")).not.toBe(50);
	});
});

// Found in the slice-4 review: character pairs barely move when one number changes,
// so a different game in the same series used to count as a close spelling.
describe('scoreNameGuess — a different number is a different game', () => {
	const pairs: [string, string][] = [
		['Far Cry 4', 'Far Cry 3'],
		['Doom 3', 'Doom 2'],
		['Resident Evil 3', 'Resident Evil 2'],
		['Final Fantasy VIII', 'Final Fantasy VII'],
		['Grand Theft Auto IV', 'Grand Theft Auto V'],
		['Mass Effect 2', 'Mass Effect 3'],
		['Portal 2', 'Portal']
	];

	it('is never close in Pro', () => {
		for (const [guess, actual] of pairs) expect(scoreNameGuess(guess, actual, 'pro')).toBe(0);
	});

	it('is at most a loose match in Normal', () => {
		for (const [guess, actual] of pairs) expect(scoreNameGuess(guess, actual)).toBeLessThan(35);
	});

	it('still allows a typo when the numbers agree, written as digits or numerals', () => {
		expect(scoreNameGuess('Resident Evl 2', 'Resident Evil 2', 'pro')).toBe(35);
		expect(scoreNameGuess('Final Fantazy 7', 'Final Fantasy VII', 'pro')).toBe(35);
	});
});

describe('scoreNameGuess in Pro', () => {
	const actual = 'The Legend of Zelda: Ocarina of Time';

	it('gives 50 for an exact match, with the same tolerance as Normal', () => {
		expect(scoreNameGuess('the legend of zelda ocarina of time', actual, 'pro')).toBe(50);
		expect(scoreNameGuess('ghost of yotei', 'Ghost of Yōtei', 'pro')).toBe(50);
	});

	it('gives 35 for a close spelling', () => {
		expect(scoreNameGuess('The Legend of Zelda Ocarina of Tim', actual, 'pro')).toBe(35);
	});

	it('gives nothing for the main title or subtitle alone, a loose match or a substring', () => {
		expect(scoreNameGuess('Ocarina of Time', actual, 'pro')).toBe(0);
		expect(scoreNameGuess('The Legend of Zelda', actual, 'pro')).toBe(0);
		expect(scoreNameGuess('Super Mario Bros', 'Super Mario World', 'pro')).toBe(0);
		expect(scoreNameGuess('ocarina', actual, 'pro')).toBe(0);
	});

	it('gives nothing for no guess', () => {
		expect(scoreNameGuess(null, actual, 'pro')).toBe(0);
		expect(scoreNameGuess('  ', actual, 'pro')).toBe(0);
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

	it('pays a miss the consolation for the name alone, at ×1.0 whatever the streak', () => {
		const score = calculateRoundScore(
			false,
			{ yearGuess: 1998, nameGuess: 'Half-Life' },
			1998,
			'Half-Life',
			6
		);
		expect(score).toMatchObject({
			base: 0,
			yearGuess: null,
			yearBonus: 0,
			nameBonus: 25,
			streakMultiplier: 1,
			total: 25
		});
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
		// (100 + 30) * 1.1 = 143.00000000000003
		const score = calculateRoundScore(
			true,
			{ yearGuess: 1997, nameGuess: null },
			1998,
			'Half-Life',
			2
		);
		expect(score.total).toBe(143);
	});

	it('scores Pro strictly when the mode says so', () => {
		const guess = { yearGuess: 1997, nameGuess: 'Ocarina of Time' };
		const actual = 'The Legend of Zelda: Ocarina of Time';
		expect(calculateRoundScore(true, guess, 1998, actual, 0)).toMatchObject({
			yearBonus: 30,
			nameBonus: 20,
			total: 150
		});
		expect(calculateRoundScore(true, guess, 1998, actual, 0, 'pro')).toMatchObject({
			yearBonus: 25,
			nameBonus: 0,
			total: 125
		});
	});

	it('keeps the same ceiling in Pro', () => {
		const score = calculateRoundScore(
			true,
			{ yearGuess: 1998, nameGuess: 'half life' },
			1998,
			'Half-Life',
			6,
			'pro'
		);
		expect(score.total).toBe(300);
	});
});

describe('scoreConsolationName', () => {
	const actual = 'The Legend of Zelda: Ocarina of Time';

	it('pays half of what the name pays after a hit: 25 exact, 15 close, 10 partial', () => {
		expect(scoreConsolationName(actual, actual)).toBe(25);
		expect(scoreConsolationName('The Legend of Zelda: Ocarina of Tme', actual)).toBe(15);
		expect(scoreConsolationName('Ocarina of Time', actual)).toBe(10);
	});

	it('pays nothing for nothing', () => {
		expect(scoreConsolationName(null, actual)).toBe(0);
		expect(scoreConsolationName('Doom', actual)).toBe(0);
	});

	it('pays no partial in Pro', () => {
		expect(scoreConsolationName(actual, actual, 'pro')).toBe(25);
		expect(scoreConsolationName('The Legend of Zelda: Ocarina of Tme', actual, 'pro')).toBe(15);
		expect(scoreConsolationName('Ocarina of Time', actual, 'pro')).toBe(0);
	});

	it('never pays more than a bare correct placement would', () => {
		expect(scoreConsolationName(actual, actual)).toBeLessThan(PLACEMENT_POINTS);
	});
});

describe('roundTally', () => {
	const round = (year: number | null, name: string | null, correct = true) =>
		calculateRoundScore(correct, { yearGuess: year, nameGuess: name }, 1998, 'Half-Life', 1);

	it('knows a name that scored anything: exact, a typo, part of it', () => {
		expect(roundTally(round(null, 'Half-Life')).nameKnown).toBe(true);
		expect(roundTally(round(null, 'Half-Lfe')).nameKnown).toBe(true);
		expect(roundTally(round(null, 'Half')).nameKnown).toBe(true);
		expect(roundTally(round(null, 'Portal')).nameKnown).toBe(false);
		expect(roundTally(round(null, null)).nameKnown).toBe(false);
	});

	it('counts a consolation name as known', () => {
		expect(roundTally(round(null, 'Half-Life', false)).nameKnown).toBe(true);
	});

	it('counts a year only when it is exact', () => {
		expect(roundTally(round(1998, null)).exactYear).toBe(true);
		expect(roundTally(round(1997, null)).exactYear).toBe(false);
		expect(roundTally(round(null, null)).exactYear).toBe(false);
	});

	it('never counts a year after a miss', () => {
		expect(roundTally(round(1998, null, false)).exactYear).toBe(false);
	});
});
