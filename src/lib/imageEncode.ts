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
 * Since Sprint 8 slice 3 it also applies the crop: the operator picks a 16:9
 * area in the crop tool, and `drawImage` with a source rectangle cuts it out
 * while scaling. Still one encoder for every path.
 *
 * Client-only: it needs `createImageBitmap` and a canvas.
 */
import { cropOutputSize, MAX_EDGE } from './crop';
import type { CropRect, PixelSize } from './types';

/** Longest edge an image is scaled down to. Screenshots arrive at wild sizes. */
export { MAX_EDGE };

const WEBP_QUALITY = 0.85;

export interface WebpOptions {
	/** Longest edge, in pixels. Images smaller than this are never scaled up. */
	maxEdge?: number;
	quality?: number;
	/** Basename for the resulting file; `.webp` is appended. */
	filename?: string;
	/**
	 * The area to keep, in the source's pixels. Without one the whole image is
	 * encoded, as before the crop tool.
	 */
	crop?: CropRect;
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
	const { maxEdge = MAX_EDGE, quality = WEBP_QUALITY, filename = 'screenshot', crop } = options;

	const bitmap = await createImageBitmap(source);
	try {
		const area = crop ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
		// The crop was drawn on this same image, so a rectangle that does not fit
		// means the two disagree about its size — fail rather than store a guess.
		if (area.x + area.width > bitmap.width || area.y + area.height > bitmap.height) {
			throw new Error('The crop does not fit the image');
		}

		const output = cropOutputSize(area, maxEdge);
		const canvas = document.createElement('canvas');
		canvas.width = output.width;
		canvas.height = output.height;

		const context = canvas.getContext('2d');
		if (!context) throw new Error('No 2D canvas context');
		context.imageSmoothingQuality = 'high';
		context.drawImage(
			bitmap,
			area.x,
			area.y,
			area.width,
			area.height,
			0,
			0,
			canvas.width,
			canvas.height
		);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/webp', quality)
		);
		if (!blob) throw new Error('Could not encode the image as WebP');

		return new File([blob], webpName(filename), { type: 'image/webp' });
	} finally {
		bitmap.close();
	}
}

/**
 * The pixel size of an image as `toWebp()` will see it — decoded the same way,
 * so a crop drawn against it always fits.
 */
export async function readImageSize(source: Blob): Promise<PixelSize> {
	const bitmap = await createImageBitmap(source);
	const size = { width: bitmap.width, height: bitmap.height };
	bitmap.close();
	return size;
}
