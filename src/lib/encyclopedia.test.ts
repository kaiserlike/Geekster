import { describe, expect, it } from 'vitest';
import { decadeOf, groupByDecade, writtenYears } from './encyclopedia';

describe('writtenYears', () => {
	it('lists every written year, oldest first', () => {
		expect(writtenYears({ 1998: {}, 1990: {}, 1994: {} })).toEqual([1990, 1994, 1998]);
	});

	it('is empty while nothing is written', () => {
		expect(writtenYears({})).toEqual([]);
	});
});

describe('decadeOf', () => {
	it('puts the first and last year of a decade in it', () => {
		expect(decadeOf(1990)).toBe(1990);
		expect(decadeOf(1999)).toBe(1990);
		expect(decadeOf(2000)).toBe(2000);
	});
});

describe('groupByDecade', () => {
	it('groups sorted years by decade and leaves empty decades out', () => {
		const years = [1989, 1990, 1999, 2010].map((year) => ({ year }));
		expect(groupByDecade(years)).toEqual([
			{ decade: 1980, years: [{ year: 1989 }] },
			{ decade: 1990, years: [{ year: 1990 }, { year: 1999 }] },
			{ decade: 2010, years: [{ year: 2010 }] }
		]);
	});

	it('has no decades without years', () => {
		expect(groupByDecade([])).toEqual([]);
	});
});
