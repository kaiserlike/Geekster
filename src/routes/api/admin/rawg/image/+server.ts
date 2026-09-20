import { error } from '@sveltejs/kit';
import { fetchRawgImage, isRawgConfigured } from '$lib/server/rawg';
import type { RequestHandler } from './$types';

/**
 * Streams a RAWG image back from our own origin so the browser can re-encode it.
 *
 * `media.rawg.io` sends no `Access-Control-Allow-Origin`, so the browser can
 * neither `fetch()` those bytes nor draw them to a canvas without tainting it —
 * `toBlob()` would throw a SecurityError. Serving the same bytes from here
 * sidesteps CORS entirely, which is what lets the RAWG path share the browser's
 * WebP encoder with the file picker instead of storing RAWG's JPEG as served.
 *
 * `fetchRawgImage()` refuses any URL that is not on rawg.io — the URL arrives
 * from the browser and is untrusted. Protected by the /api/admin guard in
 * src/hooks.server.ts.
 */
export const GET: RequestHandler = async ({ url }) => {
	const imageUrl = url.searchParams.get('url')?.trim();
	if (!imageUrl) error(400, 'Missing image URL');

	if (!isRawgConfigured()) error(503, 'RAWG_API_KEY is not set for this environment.');

	let image: { data: ArrayBuffer; contentType: string };
	try {
		image = await fetchRawgImage(imageUrl);
	} catch (err) {
		console.error('Could not fetch the RAWG image:', err);
		// A rejected host is the caller's fault, a failed download is RAWG's.
		const message = err instanceof Error ? err.message : 'Could not fetch that image.';
		error(message.includes('rawg.io') ? 400 : 502, message);
	}

	return new Response(image.data, {
		headers: {
			'Content-Type': image.contentType,
			'Content-Length': String(image.data.byteLength),
			// The browser re-encodes these immediately and never needs them again,
			// and they must not outlive the admin session in a shared cache.
			'Cache-Control': 'private, no-store'
		}
	});
};
