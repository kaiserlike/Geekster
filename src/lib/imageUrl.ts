import { base } from '$app/paths';

const ABSOLUTE_URL = /^https?:\/\//;

/**
 * Resolves a screenshot URL coming from the API or the fallback JSON.
 * Database rows migrated to Vercel Blob hold absolute URLs and must be used
 * as-is; rows (and `games.json` entries) still pointing at `static/screenshots/`
 * hold a root-relative path that needs the app's base path.
 */
export function resolveScreenshotUrl(url: string): string {
	return ABSOLUTE_URL.test(url) ? url : `${base}${url}`;
}
