/**
 * Sharing a result (Sprint 10e): the text that goes into a messenger and the copy of the share
 * card. Pure, so the exact text is tested; `shareCard.ts` draws the image and `ShareButton`
 * hands both to the Web Share API or the clipboard.
 *
 * The copy lives here rather than in the translation table because it is not the page's text:
 * it is pasted elsewhere, and the tests pin it per language.
 */
import type { Locale } from './i18n.svelte';
import { DAILY_CARDS } from './daily';

/** Where a shared result points: always the live game, whichever stage it was played on */
export const SHARE_URL = 'https://geekster.pro';

/** The share card holds this many squares; an endless run's later cards become "+ N more" */
export const CARD_SQUARES_MAX = 20;

const HIT = '🟩';
const MISS = '🟥';
/** A Daily card never reached: the run ended at 0 lives before the tenth */
const UNPLAYED = '⬛';

interface Rank {
	rank: number;
	players: number;
}

export type ShareResult =
	| {
			kind: 'daily';
			/** Daily Run #N */
			number: number;
			score: number;
			/** One character per card placed, `o` right, `x` missed */
			marks: string;
			/** Today's place among today's players; null when the server had none */
			rank: Rank | null;
	  }
	| {
			kind: 'endless';
			mode: 'normal' | 'pro';
			score: number;
			bestStreak: number;
			livesWonBack: number;
			marks: string;
			/** The device's rank on the all-time board of the mode; null without one */
			rank: Rank | null;
	  };

const COPY = {
	en: {
		daily: (n: number) => `Geekster Daily #${n}`,
		endless: (mode: string) => `Geekster · Endless ${mode}`,
		bestStreak: (n: number) => `best streak ${n}`,
		dailyRank: (r: Rank) => `#${r.rank} of ${r.players} today`,
		endlessRank: (r: Rank) => `#${r.rank} of ${r.players} worldwide`,
		tag: { daily: '// DAILY RUN', endless: '// RUN RESULT' },
		chipEndless: (mode: string) => `ENDLESS · ${mode}`,
		placed: 'PLACED',
		misses: 'MISSES',
		best: 'BEST STREAK',
		livesBack: 'LIVES WON BACK',
		today: 'TODAY',
		worldwide: 'WORLDWIDE',
		cards: 'THE RUN, CARD BY CARD',
		more: (n: number) => `+ ${n} more`,
		challenge: 'Can you beat it?'
	},
	de: {
		daily: (n: number) => `Geekster Daily #${n}`,
		endless: (mode: string) => `Geekster · Endless ${mode}`,
		bestStreak: (n: number) => `beste Serie ${n}`,
		dailyRank: (r: Rank) => `Platz ${r.rank} von ${r.players} heute`,
		endlessRank: (r: Rank) => `Platz ${r.rank} von ${r.players} weltweit`,
		tag: { daily: '// DAILY RUN', endless: '// LAUF-ERGEBNIS' },
		chipEndless: (mode: string) => `ENDLESS · ${mode}`,
		placed: 'PLATZIERT',
		misses: 'FEHLER',
		best: 'BESTE SERIE',
		livesBack: 'LEBEN ZURÜCK',
		today: 'HEUTE',
		worldwide: 'WELTWEIT',
		cards: 'DER LAUF, KARTE FÜR KARTE',
		more: (n: number) => `+ ${n} weitere`,
		challenge: 'Schaffst du mehr?'
	}
} as const;

/** 1,240 in English, 1.240 in German, as the game shows it */
export function formatShareNumber(n: number, locale: Locale): string {
	return n.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US');
}

function modeName(mode: 'normal' | 'pro'): string {
	return mode === 'pro' ? 'Pro' : 'Normal';
}

/** The marks as squares; a Daily Run lost early is padded to its ten cards with ⬛ */
export function marksToEmoji(marks: string, length = marks.length): string {
	const squares: string[] = [...marks].map((mark) => (mark === 'o' ? HIT : MISS));
	while (squares.length < length) squares.push(UNPLAYED);
	return squares.join('');
}

/** The text a player pastes: no game names, no years, so a Daily stays unspoilt */
export function shareText(result: ShareResult, locale: Locale): string {
	const copy = COPY[locale];
	const score = `${formatShareNumber(result.score, locale)} CR`;
	if (result.kind === 'daily') {
		return [
			copy.daily(result.number),
			marksToEmoji(result.marks, DAILY_CARDS),
			result.rank ? `${score} · ${copy.dailyRank(result.rank)}` : score,
			SHARE_URL
		].join('\n');
	}
	return [
		copy.endless(modeName(result.mode)),
		`${score} · ${copy.bestStreak(result.bestStreak)}`,
		...(result.rank ? [copy.endlessRank(result.rank)] : []),
		SHARE_URL
	].join('\n');
}

export interface CardStat {
	label: string;
	value: string;
	/** Which colour the card gives the value */
	tone: 'ink' | 'accent' | 'pink' | 'life' | 'danger';
}

export interface CardLayout {
	tag: string;
	chip: string;
	/** The chip's colour: pink for the Daily and Pro, turquoise for Normal */
	chipTone: 'accent' | 'pink';
	score: string;
	stats: CardStat[];
	cardsLabel: string;
	/** `o` hit, `x` miss, `-` a Daily card never reached */
	squares: string;
	/** Cards beyond the squares shown, as "+ N more"; empty when all fit */
	more: string;
	challenge: string;
	url: string;
}

/** What the share card says, in the template's order (canvas board "M3 share card") */
export function shareCardLayout(result: ShareResult, locale: Locale): CardLayout {
	const copy = COPY[locale];
	const hits = [...result.marks].filter((m) => m === 'o').length;
	const misses = result.marks.length - hits;
	const rankValue = (r: Rank) => `#${r.rank} / ${formatShareNumber(r.players, locale)}`;

	const base = {
		score: formatShareNumber(result.score, locale),
		cardsLabel: copy.cards,
		challenge: copy.challenge,
		url: SHARE_URL.replace('https://', '')
	};

	if (result.kind === 'daily') {
		return {
			...base,
			tag: copy.tag.daily,
			chip: `DAILY #${result.number}`,
			chipTone: 'pink',
			stats: [
				{ label: copy.placed, value: String(hits), tone: 'ink' },
				{ label: copy.misses, value: String(misses), tone: misses > 0 ? 'danger' : 'accent' },
				...(result.rank
					? [{ label: copy.today, value: rankValue(result.rank), tone: 'pink' as const }]
					: [])
			],
			squares: result.marks.padEnd(DAILY_CARDS, '-').slice(0, DAILY_CARDS),
			more: ''
		};
	}

	const shown = result.marks.slice(0, CARD_SQUARES_MAX);
	const hidden = result.marks.length - shown.length;
	return {
		...base,
		tag: copy.tag.endless,
		chip: copy.chipEndless(modeName(result.mode).toUpperCase()),
		chipTone: result.mode === 'pro' ? 'pink' : 'accent',
		stats: [
			{ label: copy.placed, value: String(hits), tone: 'ink' },
			{ label: copy.best, value: String(result.bestStreak), tone: 'accent' },
			{ label: copy.livesBack, value: String(result.livesWonBack), tone: 'life' },
			...(result.rank
				? [{ label: copy.worldwide, value: rankValue(result.rank), tone: 'pink' as const }]
				: [])
		],
		squares: shown,
		more: hidden > 0 ? copy.more(hidden) : ''
	};
}
