import type { BonusGuess, RoundScore } from './types';

export function scoreYearGuess(guess: number | null, actual: number): number {
	if (guess === null) return 0;
	return Math.max(0, 50 - Math.abs(guess - actual) * 10);
}

function normalize(str: string): string {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s]/g, '');
}

function bigrams(str: string): Set<string> {
	const result = new Set<string>();
	for (let i = 0; i < str.length - 1; i++) {
		result.add(str.slice(i, i + 2));
	}
	return result;
}

function diceCoefficient(a: string, b: string): number {
	const bigramsA = bigrams(a);
	const bigramsB = bigrams(b);
	if (bigramsA.size === 0 && bigramsB.size === 0) return 1;
	if (bigramsA.size === 0 || bigramsB.size === 0) return 0;
	let intersection = 0;
	for (const bg of bigramsA) {
		if (bigramsB.has(bg)) intersection++;
	}
	return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

export function scoreNameGuess(guess: string | null, actual: string): number {
	if (guess === null || guess.trim() === '') return 0;

	const normGuess = normalize(guess);
	const normActual = normalize(actual);

	// Exact match
	if (normGuess === normActual) return 50;

	// Subtitle match: check main title and subtitle parts
	const parts = actual.split(/[:\-–—]/).map((p) => normalize(p.trim()));
	for (const part of parts) {
		if (part.length > 0 && normGuess === part) return 20;
	}

	// Dice coefficient
	const dice = diceCoefficient(normGuess, normActual);
	if (dice >= 0.8) return 35;
	if (dice >= 0.5) return 20;

	// Contains check (minimum 4 chars to prevent trivial matches)
	if (normGuess.length >= 4 && normActual.includes(normGuess)) return 20;

	return 0;
}

export function getStreakMultiplier(streak: number): number {
	if (streak <= 1) return 1.0;
	return Math.min(1.5, 1 + (streak - 1) * 0.1);
}

export function calculateRoundScore(
	placementCorrect: boolean,
	guess: BonusGuess,
	actualYear: number,
	actualName: string,
	streak: number
): RoundScore {
	const base = placementCorrect ? 100 : 0;
	const yearBonus = scoreYearGuess(guess.yearGuess, actualYear);
	const nameBonus = scoreNameGuess(guess.nameGuess, actualName);
	const streakMultiplier = getStreakMultiplier(streak);
	const total = Math.round((base + yearBonus + nameBonus) * streakMultiplier);

	return {
		base,
		yearBonus,
		nameBonus,
		streakMultiplier,
		total,
		yearGuess: guess.yearGuess,
		nameGuess: guess.nameGuess,
		actualYear,
		actualName,
		placementCorrect
	};
}
