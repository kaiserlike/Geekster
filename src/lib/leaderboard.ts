import type { ClassicLeaderboardEntry, LeaderboardEntry } from './types';

// Endless solo runs. Named for the mode so that Sprint 8's Pro tier only adds a
// `-pro` key next to it, without moving anything.
const STORAGE_KEY = 'geekster-leaderboard-normal';
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

export function getLeaderboard(): LeaderboardEntry[] {
	return readEntries<LeaderboardEntry>(STORAGE_KEY);
}

/** The frozen 10-game list. Read-only: nothing writes this key any more. */
export function getClassicLeaderboard(): ClassicLeaderboardEntry[] {
	return readEntries<ClassicLeaderboardEntry>(CLASSIC_STORAGE_KEY);
}

export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
	if (!isBrowser()) return [];
	try {
		const entries = getLeaderboard();
		entries.push(entry);
		entries.sort((a, b) => b.score - a.score);
		const trimmed = entries.slice(0, MAX_ENTRIES);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
		return trimmed;
	} catch {
		return [];
	}
}

export function clearLeaderboard(): void {
	if (!isBrowser()) return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Ignore storage errors
	}
}
