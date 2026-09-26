import { describe, expect, it } from 'vitest';
import { parseDifficulty, reconcilePrimaries, type TieredShot } from './screenshotTiers';

const shot = (id: number, difficulty: string, isPrimary = false): TieredShot => ({
	id,
	difficulty,
	isPrimary
});

describe('reconcilePrimaries', () => {
	it('changes nothing when every tier already has one primary', () => {
		const shots = [shot(1, 'normal', true), shot(2, 'normal'), shot(3, 'pro', true)];
		expect(reconcilePrimaries(shots)).toEqual({ clear: [], set: [] });
	});

	it('makes the first shot of an empty tier its primary', () => {
		// a game with a Normal primary gets its first Pro shot, inserted as non-primary
		const shots = [shot(1, 'normal', true), shot(5, 'pro')];
		expect(reconcilePrimaries(shots)).toEqual({ clear: [], set: [5] });
	});

	it('leaves the Normal primary alone when a Pro shot is added', () => {
		const shots = [shot(1, 'normal', true), shot(2, 'normal'), shot(5, 'pro')];
		expect(reconcilePrimaries(shots).clear).not.toContain(1);
	});

	it('adds an extra shot to a tier without taking its primary', () => {
		const shots = [shot(1, 'normal', true), shot(9, 'normal')];
		expect(reconcilePrimaries(shots)).toEqual({ clear: [], set: [] });
	});

	it('promotes the oldest remaining shot after the primary is deleted', () => {
		const shots = [shot(7, 'normal'), shot(3, 'normal'), shot(4, 'pro', true)];
		expect(reconcilePrimaries(shots)).toEqual({ clear: [], set: [3] });
	});

	it('keeps the oldest when a tier somehow has two primaries', () => {
		const shots = [shot(8, 'pro', true), shot(2, 'pro', true)];
		expect(reconcilePrimaries(shots)).toEqual({ clear: [8], set: [] });
	});

	it('makes the preferred shot primary within its own tier only', () => {
		const shots = [shot(1, 'normal', true), shot(2, 'normal'), shot(3, 'pro', true)];
		expect(reconcilePrimaries(shots, 2)).toEqual({ clear: [1], set: [2] });
	});

	it('moving the Normal primary to Pro promotes a Normal replacement and keeps the Pro primary', () => {
		// shot 1 was the Normal primary; the move writes it as a non-primary Pro shot
		const shots = [shot(1, 'pro'), shot(2, 'normal'), shot(3, 'pro', true)];
		expect(reconcilePrimaries(shots)).toEqual({ clear: [], set: [2] });
	});

	it('a shot moved into an empty tier becomes its primary', () => {
		const shots = [shot(1, 'normal', true), shot(2, 'pro')];
		expect(reconcilePrimaries(shots)).toEqual({ clear: [], set: [2] });
	});

	it('has nothing to do for a game without shots', () => {
		expect(reconcilePrimaries([])).toEqual({ clear: [], set: [] });
	});
});

describe('parseDifficulty', () => {
	it('keeps normal and pro', () => {
		expect(parseDifficulty('normal')).toBe('normal');
		expect(parseDifficulty('pro')).toBe('pro');
	});

	it('turns the pre-0003 values and garbage into normal', () => {
		expect(parseDifficulty('medium')).toBe('normal');
		expect(parseDifficulty(undefined)).toBe('normal');
		expect(parseDifficulty(42)).toBe('normal');
	});
});
