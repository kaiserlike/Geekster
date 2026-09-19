import { del, put } from '@vercel/blob';
import { env } from '$env/dynamic/private';

/**
 * Upload convention for the public store `geekster-screenshots` (fra1).
 * It must match `scripts/migrate-screenshots-to-blob.js` or the two will drift:
 * the slug IS the identity, so no random suffix, and re-uploading a screenshot
 * replaces the file under the same pathname.
 */
const BLOB_HOST = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i;

const EXTENSIONS: Record<string, string> = {
	'image/webp': 'webp',
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/avif': 'avif'
};

export const ACCEPTED_IMAGE_TYPES = Object.keys(EXTENSIONS);

/**
 * `@vercel/blob` reads `process.env` directly, which in `vite dev` does not carry
 * the values from `.env` — so the token is passed explicitly on every call.
 */
function blobToken(): string | undefined {
	return env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

export function isBlobConfigured(): boolean {
	return blobToken() !== undefined;
}

export function isAcceptedImageType(contentType: string): boolean {
	return contentType.toLowerCase() in EXTENSIONS;
}

export function extensionFor(contentType: string): string {
	return EXTENSIONS[contentType.toLowerCase()] ?? 'webp';
}

/**
 * Stores an image under `screenshots/<slug>.<ext>` and returns its absolute URL.
 * `variant` distinguishes the extra screenshots of a game (`<slug>-2.webp`).
 */
export async function uploadScreenshot(
	slug: string,
	data: Blob | ArrayBuffer | Buffer,
	contentType: string,
	variant = 0
): Promise<string> {
	const name = variant > 0 ? `${slug}-${variant + 1}` : slug;
	const pathname = `screenshots/${name}.${extensionFor(contentType)}`;

	const result = await put(pathname, data, {
		access: 'public', // required — the store is public and cannot be switched later
		addRandomSuffix: false, // the slug IS the identity; a suffix breaks re-uploads
		allowOverwrite: true, // replacing a screenshot keeps the same pathname
		contentType,
		cacheControlMaxAge: 31536000,
		token: blobToken()
	});

	return result.url;
}

/**
 * Deletes a blob file. Local paths (`/screenshots/...`, from the seed data) are
 * ignored — those files live in the repository and are not ours to remove.
 */
export async function deleteScreenshotBlob(url: string): Promise<void> {
	if (!BLOB_HOST.test(url)) return;
	try {
		await del(url, { token: blobToken() });
	} catch (err) {
		// A missing blob must not block deleting the database row.
		console.error(`Could not delete blob ${url}:`, err);
	}
}
