import { describe, expect, it } from 'vitest';
import { gameJsonLd, SITEMAP_PAGES, sitemapXml } from './seo';

describe('sitemapXml', () => {
	it('lists every page under the production address, with its trailing slash', () => {
		const xml = sitemapXml();
		const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
		expect(locs).toEqual(SITEMAP_PAGES.map((p) => `https://geekster.pro${p.path}`));
		for (const loc of locs) expect(loc).toMatch(/\/$/);
	});

	it('names both languages of a page that has a twin', () => {
		const xml = sitemapXml([
			{ path: '/de/jahre/', alternates: { de: '/de/jahre/', en: '/en/years/' } }
		]);
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="en" href="https://geekster.pro/en/years/"/>'
		);
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="de" href="https://geekster.pro/de/jahre/"/>'
		);
	});

	it('keeps the admin, the API and the styleguide out', () => {
		expect(sitemapXml()).not.toMatch(/\/(admin|api|styleguide)/);
	});
});

describe('gameJsonLd', () => {
	it('names the site Geekster at its address, and the game free in the browser', () => {
		const [site, app] = JSON.parse(gameJsonLd('Errate das Jahr.'));
		expect(site).toMatchObject({
			'@type': 'WebSite',
			name: 'Geekster',
			url: 'https://geekster.pro/'
		});
		expect(app).toMatchObject({
			'@type': 'WebApplication',
			description: 'Errate das Jahr.',
			offers: { price: '0' }
		});
	});

	it('cannot close its script tag', () => {
		const json = gameJsonLd('</script><script>alert(1)</script>');
		expect(json).not.toContain('<');
		expect(JSON.parse(json)[1].description).toBe('</script><script>alert(1)</script>');
	});
});
