/**
 * Normal and Pro as game modes: the Pro gate, and which mode a run is played in.
 *
 * Pure, apart from the two small `localStorage` helpers at the bottom, so the
 * rules are shared by the server, the welcome screen and the tests.
 */
import { DEFAULT_DIFFICULTY, isDifficulty, type Difficulty } from './screenshotTiers';

/**
 * Pro is offered only once this many games are live in Pro (decision 1,
 * 2026-09-27). Below it Pro is shown as "Coming soon". The gate opens by itself
 * when the count reaches it — there is no switch.
 */
export const PRO_MIN_POOL = 100;

/** What the welcome screen needs to draw the mode choice. */
export interface ProGate {
	open: boolean;
	/** Live Pro games right now. */
	count: number;
	/** The minimum in force on this deployment. */
	min: number;
}

export function isProOpen(count: number, min: number): boolean {
	return count >= min;
}

/**
 * The minimum in force. `PRO_MIN_POOL_OVERRIDE` lowers (or raises) it so a Pro
 * run can be played through on staging and locally while production is still
 * gated — but it is ignored on production, so there is no public switch.
 * Anything that is not a whole number ≥ 1 is ignored too.
 */
export function resolveProMinPool(
	override: string | undefined,
	vercelEnv: string | undefined
): number {
	if (vercelEnv === 'production' || override === undefined) return PRO_MIN_POOL;
	const value = Number(override.trim());
	return Number.isInteger(value) && value >= 1 ? value : PRO_MIN_POOL;
}

/**
 * The mode a run is actually played in. A remembered Pro choice while the gate
 * is closed falls back to Normal quietly — no error, and the stored choice is
 * left as it is, so it comes back once Pro opens.
 */
export function playableMode(chosen: Difficulty, proOpen: boolean): Difficulty {
	return chosen === 'pro' && !proOpen ? 'normal' : chosen;
}

const MODE_STORAGE_KEY = 'geekster-mode';

/** The mode last chosen in this browser; `fallback` when there is none or storage is blocked. */
export function loadStoredMode(fallback: Difficulty = DEFAULT_DIFFICULTY): Difficulty {
	if (typeof window === 'undefined') return fallback;
	try {
		const value = localStorage.getItem(MODE_STORAGE_KEY);
		return isDifficulty(value) ? value : fallback;
	} catch {
		return fallback;
	}
}

export function storeMode(mode: Difficulty): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(MODE_STORAGE_KEY, mode);
	} catch {
		// A blocked storage only costs the memory of the choice.
	}
}
