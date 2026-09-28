import { describe, expect, it } from 'vitest';
import { DURATION, EASE, cubicBezier, reducedTransition } from './motion';

describe('cubicBezier', () => {
	it('starts at 0 and ends at 1', () => {
		for (const ease of Object.values(EASE)) {
			expect(ease(0)).toBe(0);
			expect(ease(1)).toBe(1);
		}
	});

	it('is the identity for a linear curve', () => {
		const linear = cubicBezier(0, 0, 1, 1);
		for (const p of [0.1, 0.25, 0.5, 0.9]) expect(linear(p)).toBeCloseTo(p, 5);
	});

	it('matches known points of CSS ease (0.25, 0.1, 0.25, 1)', () => {
		const ease = cubicBezier(0.25, 0.1, 0.25, 1);
		expect(ease(0.5)).toBeCloseTo(0.8024, 3);
	});

	it('ease-out is ahead of linear, in-out is symmetric', () => {
		expect(EASE.out(0.3)).toBeGreaterThan(0.3);
		expect(EASE.inOut(0.5)).toBeCloseTo(0.5, 5);
		expect(EASE.inOut(0.25) + EASE.inOut(0.75)).toBeCloseTo(1, 5);
	});

	it('overshoot goes past 1 before it settles', () => {
		const peak = Math.max(...Array.from({ length: 99 }, (_v, i) => EASE.overshoot((i + 1) / 100)));
		expect(peak).toBeGreaterThan(1);
	});
});

describe('reducedTransition', () => {
	it('caps the duration at fast', () => {
		expect(reducedTransition({ duration: DURATION.reveal })).toEqual({ delay: 0, duration: 120 });
		expect(reducedTransition()).toEqual({ delay: 0, duration: DURATION.fast });
	});

	it('keeps a shorter duration and the delay', () => {
		expect(reducedTransition({ duration: 80, delay: 50 })).toEqual({ delay: 50, duration: 80 });
	});
});
