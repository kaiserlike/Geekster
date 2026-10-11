import { page } from '$app/state';
import {
	isLocale,
	translate,
	translateKey,
	type Locale,
	type TranslationKey,
	type TranslationValue
} from './i18n/translations';

export type { Locale } from './i18n/translations';

const STORAGE_KEY = 'geekster-locale';

function loadLocale(): Locale {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (isLocale(stored)) return stored;
	}
	return 'de';
}

/** The player's choice: localStorage in the browser, German on the server */
let current: Locale = $state(loadLocale());

/**
 * The language on screen. A page with the language in its URL (`/en/years/`) is in that
 * language, on the server too; everywhere else it is the player's choice. `page` is per request
 * while the server renders, so nothing here is shared between requests
 */
function shown(): Locale {
	const lang = page.params.lang;
	return isLocale(lang) ? lang : current;
}

export function getLocale(): Locale {
	return shown();
}

/** A number in the shown language's notation: 2,340 in English, 2.340 in German */
export function formatNumber(n: number, fractionDigits = 0): string {
	return n.toLocaleString(shown() === 'de' ? 'de-DE' : 'en-US', {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits
	});
}

/** The streak multiplier as the HUD writes it: ×1.5, ×1,5 in German */
export function formatMultiplier(m: number): string {
	return `×${formatNumber(m, 1)}`;
}

/**
 * A day and a short month, as the leaderboard shows it: "26 Sep", "26. Sept.". Takes an ISO
 * string or SQLite's `2026-09-20 19:10:33` (UTC, no zone), which Safari won't parse as it is
 */
export function formatShortDate(value: string): string {
	const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
		? `${value.replace(' ', 'T')}Z`
		: value;
	const time = Date.parse(iso);
	if (Number.isNaN(time)) return '';
	return new Intl.DateTimeFormat(shown() === 'de' ? 'de-DE' : 'en-GB', {
		day: 'numeric',
		month: 'short'
	}).format(time);
}

export function setLocale(locale: Locale): void {
	current = locale;
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, locale);
	}
}

export function t(key: TranslationKey): TranslationValue {
	return translate(shown(), key);
}

export function ts(key: TranslationKey): string {
	return t(key) as string;
}

export function tf<T extends (...args: never[]) => string>(key: TranslationKey): T {
	return t(key) as T;
}

/**
 * Translates a key that is only known at runtime — e.g. the error key stored in
 * the game state. Unknown keys are returned unchanged instead of throwing.
 */
export function tk(key: string): string {
	return translateKey(shown(), key);
}
