import { json } from '@sveltejs/kit';
import { isRawgConfigured, searchGames } from '$lib/server/rawg';
import type { RequestHandler } from './$types';

// Protected by the /api/admin guard in src/hooks.server.ts.
export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q')?.trim();
	if (!query) return json({ error: 'Missing search term' }, { status: 400 });

	if (!isRawgConfigured()) {
		return json({ error: 'RAWG_API_KEY is not set for this environment.' }, { status: 503 });
	}

	try {
		return json({ results: await searchGames(query) });
	} catch (err) {
		console.error('RAWG search failed:', err);
		return json({ error: 'The RAWG lookup failed.' }, { status: 502 });
	}
};
