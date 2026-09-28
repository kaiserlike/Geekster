import type { ClassicLeaderboardEntry, Difficulty, LeaderboardEntry } from './types';

// Endless solo runs, one list per mode: `geekster-leaderboard-normal` and
// `geekster-leaderboard-pro`. Scores of the two modes are not comparable.
function storageKey(mode: Difficulty): string {
	return `geekster-leaderboard-${mode}`;
}
// The old 10-game mode wrote here. Its scores are capped by the round length and
// cannot be ranked against endless runs, so the key is only ever read again.
const CLASSIC_STORAGE_KEY = 'geekster-leaderboard';
const MAX_ENTRIES = 20;

function isBrowser(): boolean {
	return typeof window !== 'undefined';
}

function readEntries<T>(key: string): T[] {
	if (!isBrowser()) return [];
	try {
		const data = localStorage.getItem(key);
		if (!data) return [];
		const parsed: unknown = JSON.parse(data);
		return Array.isArray(parsed) ? (parsed as T[]) : [];
	} catch {
		return [];
	}
}

export function getLeaderboard(mode: Difficulty): LeaderboardEntry[] {
	return readEntries<LeaderboardEntry>(storageKey(mode));
}

/** The frozen 10-game list. Read-only: nothing writes this key any more. */
export function getClassicLeaderboard(): ClassicLeaderboardEntry[] {
	return readEntries<ClassicLeaderboardEntry>(CLASSIC_STORAGE_KEY);
}

/** Whether this browser has finished a run before, in any mode or the old 10-game one. */
export function hasPlayedBefore(): boolean {
	return (
		getLeaderboard('normal').length > 0 ||
		getLeaderboard('pro').length > 0 ||
		getClassicLeaderboard().length > 0
	);
}

export function addLeaderboardEntry(mode: Difficulty, entry: LeaderboardEntry): LeaderboardEntry[] {
	if (!isBrowser()) return [];
	try {
		const entries = getLeaderboard(mode);
		entries.push(entry);
		entries.sort((a, b) => b.score - a.score);
		const trimmed = entries.slice(0, MAX_ENTRIES);
		localStorage.setItem(storageKey(mode), JSON.stringify(trimmed));
		return trimmed;
	} catch {
		return [];
	}
}
