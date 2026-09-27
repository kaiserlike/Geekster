import type { BonusGuess, RoundScore } from './types';
import { DEFAULT_DIFFICULTY, type Difficulty } from './screenshotTiers';

/**
 * Year bonus by how many years off the guess is: index 0 is the exact year.
 * Anything past the end of the list scores 0. Decided 2026-09-27 (decision 2):
 * Normal pays up to three years off, Pro only up to one.
 */
const YEAR_BONUS: Record<Difficulty, readonly number[]> = {
	normal: [50, 30, 20, 10],
	pro: [50, 25]
};

const NAME_EXACT = 50;
const NAME_CLOSE = 35;
/** Normal only: a main title or subtitle alone, a loose match, a substring. */
const NAME_PARTIAL = 20;

export function scoreYearGuess(
	guess: number | null,
	actual: number,
	mode: Difficulty = DEFAULT_DIFFICULTY
): number {
	if (guess === null) return 0;
	return YEAR_BONUS[mode][Math.abs(guess - actual)] ?? 0;
}

/**
 * Lower case, accents folded (ō → o, é → e), punctuation and apostrophes of
 * any kind dropped, runs of spaces collapsed.
 */
function normalize(str: string): string {
	return str
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s]/gu, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** For the exact check only: a hyphen or space that is there or not is no difference. */
function compact(str: string): string {
	return normalize(str).replace(/ /g, '');
}

/** "Doom (2016)" → "Doom": the parenthesis tells two games apart, it is not the title. */
function withoutTrailingParenthesis(str: string): string {
	return str.replace(/\s*\([^)]*\)\s*$/, '');
}

function isExactName(guess: string, actual: string): boolean {
	const g = compact(guess);
	return g === compact(actual) || g === compact(withoutTrailingParenthesis(actual));
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

export function scoreNameGuess(
	guess: string | null,
	actual: string,
	mode: Difficulty = DEFAULT_DIFFICULTY
): number {
	if (guess === null || guess.trim() === '') return 0;

	if (isExactName(guess, actual)) return NAME_EXACT;

	const normGuess = normalize(guess);
	const normActual = normalize(actual);
	const dice = diceCoefficient(normGuess, normActual);

	// Pro: exact or a close spelling, nothing for knowing part of the title.
	if (mode === 'pro') return dice >= 0.8 ? NAME_CLOSE : 0;

	// Subtitle match: check main title and subtitle parts
	const parts = actual.split(/[:\-–—]/).map((p) => normalize(p.trim()));
	for (const part of parts) {
		if (part.length > 0 && normGuess === part) return NAME_PARTIAL;
	}

	if (dice >= 0.8) return NAME_CLOSE;
	if (dice >= 0.5) return NAME_PARTIAL;

	// Contains check (minimum 4 chars to prevent trivial matches)
	if (normGuess.length >= 4 && normActual.includes(normGuess)) return NAME_PARTIAL;

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
	streak: number,
	mode: Difficulty = DEFAULT_DIFFICULTY
): RoundScore {
	const base = placementCorrect ? 100 : 0;
	const yearBonus = scoreYearGuess(guess.yearGuess, actualYear, mode);
	const nameBonus = scoreNameGuess(guess.nameGuess, actualName, mode);
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
