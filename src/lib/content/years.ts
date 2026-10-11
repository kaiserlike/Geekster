// The encyclopedia's own words, one entry per year and language (decision 12-3). A year page
// exists exactly when its entry does (12-5): no entry, no page, never a thin one. Written from
// facts, never copied: Wikipedia's text is CC BY-SA. Moves into the admin panel in E2.

import type { Locale } from '$lib/i18n/translations';

export interface YearText {
	/** A paragraph or two: what the year was like */
	intro: string;
	/** Short, surprising, checkable */
	facts: string[];
	/** What changed in hardware and technology */
	tech: string[];
}

export type YearTexts = Readonly<Record<number, Readonly<Record<Locale, YearText>>>>;

export const YEAR_TEXTS: YearTexts = {};
