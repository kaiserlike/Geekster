/**
 * The first-run coach mark (Sprint 9e): a callout on the first card of a player's first run,
 * pointing at the anchor year and the slots. Shown once per browser.
 *
 * `geekster-coach-seen` is written when the player places that card or closes the callout. A
 * browser that already has a finished run (a player from before 9e) counts as having seen it.
 */
import { hasPlayedBefore } from './leaderboard';

const COACH_STORAGE_KEY = 'geekster-coach-seen';

export function hasSeenCoach(): boolean {
	if (typeof window === 'undefined') return true;
	try {
		return localStorage.getItem(COACH_STORAGE_KEY) === '1' || hasPlayedBefore();
	} catch {
		// Blocked storage: the callout would come back on every run, so it is not shown at all.
		return true;
	}
}

export function markCoachSeen(): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(COACH_STORAGE_KEY, '1');
	} catch {
		// A blocked storage only costs the memory of it; hasSeenCoach() says true there anyway.
	}
}
