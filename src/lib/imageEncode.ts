/**
 * Browser-side image normalisation, shared by every path that puts a screenshot
 * into the blob store.
 *
 * The browser already has a WebP encoder and it costs nothing to use, so both
 * the file picker and the RAWG import re-encode here rather than on the server.
 * Doing it in one place is the point: the RAWG path used to store whatever RAWG
 * served — a full-size JPEG, roughly ten times the size of the WebP — purely
 * because it never passed through the browser.
 *
 * Client-only: it needs `createImageBitmap` and a canvas.
 */

/** Longest edge an image is scaled down to. Screenshots arrive at wild sizes. */
export const MAX_EDGE = 1600;

const WEBP_QUALITY = 0.85;

export interface WebpOptions {
	/** Longest edge, in pixels. Images smaller than this are never scaled up. */
	maxEdge?: number;
	quality?: number;
	/** Basename for the resulting file; `.webp` is appended. */
	filename?: string;
}

/** Strips any extension so the result is always named `<base>.webp`. */
function webpName(filename: string): string {
	const base = filename.replace(/\.\w+$/, '').trim();
	return `${base || 'screenshot'}.webp`;
}

/**
 * Re-encodes an image to WebP, scaled so its longest edge is at most `maxEdge`.
 *
 * Throws if the blob cannot be decoded or the canvas cannot encode it — the
 * caller decides whether to fall back to the original bytes or show an error.
 */
export async function toWebp(source: Blob, options: WebpOptions = {}): Promise<File> {
	const { maxEdge = MAX_EDGE, quality = WEBP_QUALITY, filename = 'screenshot' } = options;

	const bitmap = await createImageBitmap(source);
	try {
		const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);

		const context = canvas.getContext('2d');
		if (!context) throw new Error('No 2D canvas context');
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/webp', quality)
		);
		if (!blob) throw new Error('Could not encode the image as WebP');

		return new File([blob], webpName(filename), { type: 'image/webp' });
	} finally {
		bitmap.close();
	}
}
