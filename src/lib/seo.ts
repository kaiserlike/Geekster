// What every page tells a crawler and a link preview: the site's name, the share image, the
// locale names Open Graph wants. The root layout uses it for the game's English default;
// `SeoHead.svelte` for pages that carry their language in the URL.

import type { Locale } from './i18n/translations';

export const SITE_NAME = 'Geekster';

export const OG_IMAGE = {
	path: '/og-image.png',
	type: 'image/png',
	width: 1200,
	height: 630,
	alt: 'The Geekster wordmark beside a timeline of video game screenshots, one card marked ????'
} as const;

export const OG_LOCALE: Record<Locale, string> = { de: 'de_DE', en: 'en_US' };

/** The language search engines get when they match none of a page's languages */
export const DEFAULT_LOCALE: Locale = 'en';
