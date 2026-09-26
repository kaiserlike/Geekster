import { describe, expect, it } from 'vitest';
import { findCorrectIndex, isPlacementCorrect } from './placement';

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
