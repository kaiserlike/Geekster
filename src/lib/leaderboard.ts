import type { LeaderboardEntry } from './types';

const STORAGE_KEY = 'geekster-leaderboard';
const MAX_ENTRIES = 20;

function isBrowser(): boolean {
	return typeof window !== 'undefined';
}

export function getLeaderboard(): LeaderboardEntry[] {
	if (!isBrowser()) return [];
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		if (!data) return [];
		return JSON.parse(data) as LeaderboardEntry[];
	} catch {
		return [];
	}
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
