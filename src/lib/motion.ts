/**
 * Motion tokens and reduced-motion-aware transitions (Sprint 9b).
 *
 * The durations and easings mirror `--duration-*` and `--ease-*` in `src/app.css`. Every
 * component from 9c on imports its transitions from here instead of `svelte/transition`, so
 * `prefers-reduced-motion` is honoured in one place: with it, anything that travels (fly, slide,
 * scale) becomes a plain fade of at most `DURATION.fast` — "opacity only, ≤ 120 ms".
 */
import { prefersReducedMotion } from 'svelte/motion';
import {
	fade as svelteFade,
	fly as svelteFly,
	scale as svelteScale,
	slide as svelteSlide,
	type FadeParams,
	type FlyParams,
	type ScaleParams,
	type SlideParams,
	type TransitionConfig
} from 'svelte/transition';

export const DURATION = {
	fast: 120,
	base: 200,
	slow: 400,
	reveal: 900
} as const;

/**
 * A CSS `cubic-bezier(x1, y1, x2, y2)` as an easing function for Svelte. Solves x(t) = progress
 * by Newton's method with a bisection fallback, then returns y(t).
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (p: number) => number {
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;

	const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
	const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
	const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

	function solveT(x: number): number {
		let t = x;
		for (let i = 0; i < 8; i++) {
			const error = sampleX(t) - x;
			if (Math.abs(error) < 1e-6) return t;
			const slope = slopeX(t);
			if (Math.abs(slope) < 1e-6) break;
			t -= error / slope;
		}
		let lo = 0;
		let hi = 1;
		t = x;
		for (let i = 0; i < 30; i++) {
			const value = sampleX(t);
			if (Math.abs(value - x) < 1e-6) return t;
			if (value < x) lo = t;
			else hi = t;
			t = (lo + hi) / 2;
		}
		return t;
	}

	return (p: number) => {
		if (p <= 0) return 0;
		if (p >= 1) return 1;
		return sampleY(solveT(p));
	};
}

export const EASE = {
	/** Everything that enters */
	out: cubicBezier(0.2, 0.8, 0.2, 1),
	/** Movement between two places */
	inOut: cubicBezier(0.65, 0, 0.35, 1),
	/** Heart pop, a card landing in its slot */
	overshoot: cubicBezier(0.34, 1.56, 0.64, 1)
} as const;

interface BaseParams {
	delay?: number;
	duration?: number;
	easing?: (t: number) => number;
}

/**
 * What a transition turns into under reduced motion: always a fade, never longer than
 * `DURATION.fast`, keeping only its delay. Pure, so it is unit-tested without a browser.
 */
export function reducedTransition(params: BaseParams = {}): FadeParams {
	return {
		delay: params.delay ?? 0,
		duration: Math.min(params.duration ?? DURATION.base, DURATION.fast)
	};
}

function withDefaults<T extends BaseParams>(params: T | undefined): T {
	return { duration: DURATION.base, easing: EASE.out, ...params } as T;
}

export function fade(node: Element, params?: FadeParams): TransitionConfig {
	if (prefersReducedMotion.current) return svelteFade(node, reducedTransition(params));
	return svelteFade(node, withDefaults(params));
}

export function fly(node: Element, params?: FlyParams): TransitionConfig {
	if (prefersReducedMotion.current) return svelteFade(node, reducedTransition(params));
	return svelteFly(node, withDefaults(params));
}

export function slide(node: Element, params?: SlideParams): TransitionConfig {
	if (prefersReducedMotion.current) return svelteFade(node, reducedTransition(params));
	return svelteSlide(node, withDefaults(params));
}

export function scale(node: Element, params?: ScaleParams): TransitionConfig {
	if (prefersReducedMotion.current) return svelteFade(node, reducedTransition(params));
	return svelteScale(node, withDefaults(params));
}
