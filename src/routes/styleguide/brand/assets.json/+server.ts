import { json } from '@sveltejs/kit';
import { BRAND_ASSETS } from '$lib/brand';

/** The list `npm run brand:render` walks; the script is CommonJS and cannot import brand.ts. */
export function GET(): Response {
	return json(BRAND_ASSETS);
}
