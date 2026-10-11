// The encyclopedia's URLs carry the language and a localised first segment: `/de/jahre/1998/`,
// `/en/years/1998/` (decision 12-1). One route tree serves both: the folder is named after the
// English segment (`src/routes/[lang=locale]/years/`), and `reroute` in `src/hooks.ts` maps the
// public path onto it. Everything here is pure, so the browser, the server and the tests agree.

import { isLocale, LOCALES, type Locale } from './i18n/translations';

/** Each localised section: the route folder's name, and its first segment per language */
const SECTIONS = {
	years: { en: 'years', de: 'jahre' }
} as const satisfies Record<string, Record<Locale, string>>;

export type Section = keyof typeof SECTIONS;

/** The language the path names in its first segment, or null for the game and everything else */
export function localeOfPath(pathname: string): Locale | null {
	const first = pathname.split('/')[1];
	return isLocale(first) ? first : null;
}

interface LocalisedPath {
	locale: Locale;
	section: Section;
	/** Everything after the section's segment, slashes included: `/1998/`, `/`, or `` */
	rest: string;
}

/**
 * Reads `/<locale>/<segment><rest>`, accepting either language's segment, so a wrong one can be
 * redirected. Null for any path outside the encyclopedia
 */
function parse(pathname: string): LocalisedPath | null {
	const match = /^\/([^/]+)\/([^/]+)(\/.*)?$/.exec(pathname);
	if (!match) return null;
	const [, locale, segment, rest = ''] = match;
	if (!isLocale(locale)) return null;
	for (const [section, segments] of Object.entries(SECTIONS)) {
		if (LOCALES.some((l) => segments[l] === segment)) {
			return { locale, section: section as Section, rest };
		}
	}
	return null;
}

/** The public URL of a section in one language: `localizedPath('de', 'years', '1998')` */
export function localizedPath(
	locale: Locale,
	section: Section,
	...parts: (string | number)[]
): string {
	const tail = parts.map((part) => `${part}/`).join('');
	return `/${locale}/${SECTIONS[section][locale]}/${tail}`;
}

/** The route the public path is served by (`/de/jahre/1998/` → `/de/years/1998/`), or null */
export function routePath(pathname: string): string | null {
	const parsed = parse(pathname);
	if (!parsed) return null;
	return `/${parsed.locale}/${SECTIONS[parsed.section].en}${parsed.rest}`;
}

/** Where a path with the other language's segment belongs (`/de/years/` → `/de/jahre/`), or null */
export function correctedPath(pathname: string): string | null {
	const parsed = parse(pathname);
	if (!parsed) return null;
	const correct = `/${parsed.locale}/${SECTIONS[parsed.section][parsed.locale]}${parsed.rest}`;
	return correct === pathname ? null : correct;
}

/** The same page in another language (`/de/jahre/1998/` → `/en/years/1998/`), or null */
export function alternatePath(pathname: string, locale: Locale): string | null {
	const parsed = parse(pathname);
	if (!parsed) return null;
	return `/${locale}/${SECTIONS[parsed.section][locale]}${parsed.rest}`;
}
