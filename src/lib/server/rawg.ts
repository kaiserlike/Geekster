import { env } from '$env/dynamic/private';
import type { RawgCandidate } from '$lib/types';

const RAWG_SEARCH = 'https://api.rawg.io/api/games';

/** Only RAWG's own media host may be fetched — an admin-supplied URL is untrusted input. */
const RAWG_MEDIA_HOST = /^https:\/\/([a-z0-9-]+\.)*rawg\.io\//i;

export function isRawgConfigured(): boolean {
	return Boolean(env.RAWG_API_KEY?.trim());
}

interface RawgResult {
	id: number;
	name: string;
	released: string | null;
	background_image: string | null;
	short_screenshots?: { id: number; image: string }[];
}

export async function searchGames(query: string, limit = 5): Promise<RawgCandidate[]> {
	const key = env.RAWG_API_KEY?.trim();
	if (!key) throw new Error('RAWG_API_KEY is not set');

	const url = new URL(RAWG_SEARCH);
	url.searchParams.set('key', key);
	url.searchParams.set('search', query);
	url.searchParams.set('page_size', String(limit));

	const response = await fetch(url);
	if (!response.ok) throw new Error(`RAWG responded ${response.status}`);

	const body: { results?: RawgResult[] } = await response.json();

	return (body.results ?? []).map((result) => ({
		id: result.id,
		name: result.name,
		released: result.released,
		year: result.released ? Number(result.released.slice(0, 4)) : null,
		screenshots: [
			...(result.short_screenshots ?? [])
				.map((shot) => shot.image)
				// RAWG repeats the cover art as the first "screenshot" — it usually
				// carries the logo, which gives the answer away.
				.filter((image) => image && image !== result.background_image),
			...(result.background_image ? [result.background_image] : [])
		]
	}));
}

/** Downloads a RAWG image so it can be pushed into the blob store. */
export async function fetchRawgImage(
	imageUrl: string
): Promise<{ data: ArrayBuffer; contentType: string }> {
	if (!RAWG_MEDIA_HOST.test(imageUrl)) {
		throw new Error('Only images hosted by rawg.io can be imported');
	}

	const response = await fetch(imageUrl);
	if (!response.ok) throw new Error(`Could not download the image (${response.status})`);

	const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? 'image/jpeg';
	return { data: await response.arrayBuffer(), contentType };
}
