import { sitemapXml } from '$lib/seo';
import type { RequestHandler } from './$types';

// A file name, not a page: `/sitemap.xml/` would be a redirect a crawler need not follow
export const trailingSlash = 'never';

export const GET: RequestHandler = () =>
	new Response(sitemapXml(), {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
