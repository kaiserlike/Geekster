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

/** The address search engines are told about, whichever stage renders the page */
export const SITE_ORIGIN = 'https://geekster.pro';

/**
 * The pages worth a search result, in `trailingSlash = 'always'` form. The admin, the API and
 * the styleguide stay out (robots.txt). A page in both languages lists each with its twin
 */
export const SITEMAP_PAGES: { path: string; alternates?: Record<Locale, string> }[] = [
	{ path: '/' },
	{ path: '/leaderboard/' },
	{ path: '/de/jahre/', alternates: { de: '/de/jahre/', en: '/en/years/' } },
	{ path: '/en/years/', alternates: { de: '/de/jahre/', en: '/en/years/' } },
	{ path: '/impressum/' },
	{ path: '/privacy/' }
];

/** `/sitemap.xml`, with `hreflang` alternates where a page has a twin (decision 12-1) */
export function sitemapXml(pages = SITEMAP_PAGES, origin = SITE_ORIGIN): string {
	const urls = pages.map(({ path, alternates }) => {
		const links = alternates
			? Object.entries(alternates).map(
					([lang, href]) =>
						`\n    <xhtml:link rel="alternate" hreflang="${lang}" href="${origin}${href}"/>`
				)
			: [];
		return `  <url>\n    <loc>${origin}${path}</loc>${links.join('')}\n  </url>`;
	});
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...urls,
		'</urlset>',
		''
	].join('\n');
}

/**
 * The game's structured data for `/`: `WebSite` gives Google the site's name for its results,
 * `WebApplication` says what it is. As a string ready for a `<script type="application/ld+json">`;
 * `<` is escaped so no value can close the script
 */
export function gameJsonLd(description: string, origin = SITE_ORIGIN): string {
	const data = [
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: SITE_NAME,
			alternateName: 'geekster.pro',
			url: `${origin}/`,
			inLanguage: ['de', 'en']
		},
		{
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: SITE_NAME,
			url: `${origin}/`,
			description,
			applicationCategory: 'GameApplication',
			genre: 'Quiz',
			operatingSystem: 'Any (web browser)',
			inLanguage: ['de', 'en'],
			image: `${origin}${OG_IMAGE.path}`,
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
		}
	];
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
