import { describe, expect, it } from 'vitest';
import { isProOpen, playableMode, PRO_MIN_POOL, resolveProMinPool } from './modes';

describe('isProOpen', () => {
	it('opens exactly at the minimum', () => {
		expect(isProOpen(PRO_MIN_POOL - 1, PRO_MIN_POOL)).toBe(false);
		expect(isProOpen(PRO_MIN_POOL, PRO_MIN_POOL)).toBe(true);
		expect(isProOpen(PRO_MIN_POOL + 50, PRO_MIN_POOL)).toBe(true);
	});

	it('is closed with an empty pool', () => {
		expect(isProOpen(0, PRO_MIN_POOL)).toBe(false);
	});
});

describe('resolveProMinPool', () => {
	it('is PRO_MIN_POOL without an override', () => {
		expect(resolveProMinPool(undefined, undefined)).toBe(PRO_MIN_POOL);
		expect(resolveProMinPool(undefined, 'preview')).toBe(PRO_MIN_POOL);
	});

	it('takes the override outside production', () => {
		expect(resolveProMinPool('3', 'preview')).toBe(3);
		expect(resolveProMinPool(' 5 ', undefined)).toBe(5);
		expect(resolveProMinPool('3', 'development')).toBe(3);
	});

	it('ignores the override on production', () => {
		expect(resolveProMinPool('1', 'production')).toBe(PRO_MIN_POOL);
	});

	it('ignores an override that is not a whole number of at least 1', () => {
		for (const bad of ['', '0', '-4', '2.5', 'abc']) {
			expect(resolveProMinPool(bad, 'preview')).toBe(PRO_MIN_POOL);
		}
	});
});

describe('playableMode', () => {
	it('plays Pro only while the gate is open', () => {
		expect(playableMode('pro', true)).toBe('pro');
		expect(playableMode('pro', false)).toBe('normal');
	});

	it('always plays Normal when Normal is chosen', () => {
		expect(playableMode('normal', true)).toBe('normal');
		expect(playableMode('normal', false)).toBe('normal');
	});
});
