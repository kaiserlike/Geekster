/**
 * The crop rules for screenshots (Sprint 8 slice 3), in the source image's own
 * pixels. Pure, so the crop tool, the encoder and the server all apply the same
 * numbers and Vitest can check them without a canvas.
 *
 * Every crop is 16:9, because the card shows exactly that. A height is always
 * derived from its width (`cropHeightFor`), so "16:9" means "within one pixel
 * of height", never an exact ratio most widths cannot have.
 */
import type { CropRect, CropSelection, PixelSize } from './types';

/** Longest edge a stored screenshot is scaled down to, cropped or not. */
export const MAX_EDGE = 1600;

/**
 * The tool will not zoom in further than this many source pixels across
 * (640×360), so a Pro crop cannot turn into pixel soup. A source whose largest
 * 16:9 area is narrower than this is locked at that area instead.
 */
export const MIN_CROP_WIDTH = 640;

/** Below this width (960×540) the tool warns that the shot will look soft. */
export const SOFT_CROP_WIDTH = 960;

/** Largest image dimension a posted crop may claim — far beyond any real screenshot. */
const MAX_SOURCE_EDGE = 20000;

/** The six form fields a crop travels in, shared by the pickers and the actions. */
export const CROP_FIELDS = {
	x: 'cropX',
	y: 'cropY',
	width: 'cropWidth',
	height: 'cropHeight',
	sourceWidth: 'sourceWidth',
	sourceHeight: 'sourceHeight'
} as const;

export type CropQuality = 'ok' | 'soft' | 'tooSmall';

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** The 16:9 height for a crop width, rounded to a whole pixel. */
export function cropHeightFor(width: number): number {
	return Math.round((width * 9) / 16);
}

/** Width of the largest 16:9 area the image can hold. */
export function maxCropWidth(source: PixelSize): number {
	return Math.min(source.width, Math.floor((source.height * 16) / 9));
}

/**
 * The narrowest crop allowed on this image: the 640 px minimum, or the whole
 * largest 16:9 area when the image cannot even hold that.
 */
export function minCropWidth(source: PixelSize): number {
	return Math.min(MIN_CROP_WIDTH, maxCropWidth(source));
}

/**
 * The largest centred 16:9 area — exactly what the card's `object-cover` showed
 * before the crop tool existed, so an untouched crop looks the same as then.
 */
export function defaultCrop(source: PixelSize): CropRect {
	const width = maxCropWidth(source);
	const height = cropHeightFor(width);
	return {
		x: Math.floor((source.width - width) / 2),
		y: Math.floor((source.height - height) / 2),
		width,
		height
	};
}

/**
 * Brings any requested rectangle back within the rules: whole pixels, a width
 * between the minimum and the largest 16:9 area, the height derived from it,
 * and the whole area inside the image. Only `x`, `y` and `width` are read.
 */
export function clampCrop(rect: Pick<CropRect, 'x' | 'y' | 'width'>, source: PixelSize): CropRect {
	const width = clamp(Math.round(rect.width), minCropWidth(source), maxCropWidth(source));
	const height = cropHeightFor(width);
	return {
		x: clamp(Math.round(rect.x), 0, source.width - width),
		y: clamp(Math.round(rect.y), 0, source.height - height),
		width,
		height
	};
}

/** Moves the crop by a distance in source pixels, stopping at the image's edges. */
export function panCrop(rect: CropRect, dx: number, dy: number, source: PixelSize): CropRect {
	return clampCrop({ x: rect.x + dx, y: rect.y + dy, width: rect.width }, source);
}

/**
 * Zooms by `factor` (above 1 zooms in, i.e. a narrower crop), keeping the point
 * at `anchor` where it is. The anchor is a fraction of the crop, so 0.5/0.5 is
 * its centre and a wheel under the pointer passes where the pointer is.
 */
export function zoomCrop(
	rect: CropRect,
	factor: number,
	source: PixelSize,
	anchor: { x: number; y: number } = { x: 0.5, y: 0.5 }
): CropRect {
	const width = clamp(Math.round(rect.width / factor), minCropWidth(source), maxCropWidth(source));
	const height = cropHeightFor(width);
	const pointX = rect.x + anchor.x * rect.width;
	const pointY = rect.y + anchor.y * rect.height;
	return clampCrop({ x: pointX - anchor.x * width, y: pointY - anchor.y * height, width }, source);
}

/** Sets the crop to a given width around its centre — what the zoom slider does. */
export function resizeCrop(rect: CropRect, width: number, source: PixelSize): CropRect {
	return zoomCrop(rect, rect.width / width, source);
}

/**
 * Size of the WebP a crop produces: the crop itself, scaled down so the longest
 * edge is at most `maxEdge` (at most 1600×900) and never scaled up. Also used
 * for an uncropped image, which is why it keeps any aspect ratio.
 */
export function cropOutputSize(rect: CropRect, maxEdge: number = MAX_EDGE): PixelSize {
	if (rect.width <= maxEdge && rect.height <= maxEdge) {
		return { width: rect.width, height: rect.height };
	}
	const scale = maxEdge / Math.max(rect.width, rect.height);
	return { width: Math.round(rect.width * scale), height: Math.round(rect.height * scale) };
}

/** Whether a crop is sharp enough for the card, soft, or below the hard minimum. */
export function cropQuality(rect: CropRect): CropQuality {
	if (rect.width < MIN_CROP_WIDTH) return 'tooSmall';
	if (rect.width < SOFT_CROP_WIDTH) return 'soft';
	return 'ok';
}

/** Writes a crop into the form fields `parseCrop()` reads. */
export function appendCrop(form: FormData, selection: CropSelection): void {
	const { crop, source } = selection;
	form.set(CROP_FIELDS.x, String(crop.x));
	form.set(CROP_FIELDS.y, String(crop.y));
	form.set(CROP_FIELDS.width, String(crop.width));
	form.set(CROP_FIELDS.height, String(crop.height));
	form.set(CROP_FIELDS.sourceWidth, String(source.width));
	form.set(CROP_FIELDS.sourceHeight, String(source.height));
}

/** A non-negative whole number written as plain digits, or null. */
function pixels(value: FormDataEntryValue | null): number | null {
	if (typeof value !== 'string' || !/^\d{1,6}$/.test(value)) return null;
	return Number(value);
}

/**
 * The crop a form posted, with the source size it claims, if it is one the
 * tool could have produced. It comes from the browser, so it is untrusted:
 * whole pixels, inside the claimed source image, 16:9 within a pixel of
 * height, and no narrower than the minimum that image allows. Anything else is
 * dropped rather than rejected — the upload is fine either way, it just records
 * no crop (the same stance `rawgSourceUrl()` takes on a source URL).
 */
export function parseCropSelection(form: Pick<FormData, 'get'>): CropSelection | null {
	const x = pixels(form.get(CROP_FIELDS.x));
	const y = pixels(form.get(CROP_FIELDS.y));
	const width = pixels(form.get(CROP_FIELDS.width));
	const height = pixels(form.get(CROP_FIELDS.height));
	const sourceWidth = pixels(form.get(CROP_FIELDS.sourceWidth));
	const sourceHeight = pixels(form.get(CROP_FIELDS.sourceHeight));

	if (
		x === null ||
		y === null ||
		width === null ||
		height === null ||
		sourceWidth === null ||
		sourceHeight === null
	) {
		return null;
	}

	const source = { width: sourceWidth, height: sourceHeight };
	if (source.width < 1 || source.height < 1) return null;
	if (source.width > MAX_SOURCE_EDGE || source.height > MAX_SOURCE_EDGE) return null;
	if (height < 1 || width < minCropWidth(source)) return null;
	if (x + width > source.width || y + height > source.height) return null;
	if (Math.abs(16 * height - 9 * width) > 16) return null;

	return { crop: { x, y, width, height }, source };
}

/** `parseCropSelection()` without the source size — what a new upload stores. */
export function parseCrop(form: Pick<FormData, 'get'>): CropRect | null {
	return parseCropSelection(form)?.crop ?? null;
}

/**
 * Maps a crop of a *stored* screenshot back into the pixels of the image the
 * stored one was cut from (US-8.8, re-crop without the original). The stored
 * WebP is `previous` scaled by `cropOutputSize()`, so the posted selection must
 * claim exactly that size — otherwise it was drawn on something else and is
 * dropped. With no previous crop (a shot from before the crop tool) the stored
 * image is the only original there is, and the selection is kept as it is.
 */
export function recropFromStored(
	previous: CropRect | null,
	selection: CropSelection
): CropRect | null {
	if (!previous) return selection.crop;

	const stored = cropOutputSize(previous);
	if (selection.source.width !== stored.width || selection.source.height !== stored.height) {
		return null;
	}

	const scale = previous.width / stored.width;
	const width = Math.min(previous.width, Math.round(selection.crop.width * scale));
	const height = Math.min(previous.height, cropHeightFor(width));
	return {
		x: Math.min(
			previous.x + Math.round(selection.crop.x * scale),
			previous.x + previous.width - width
		),
		y: Math.min(
			previous.y + Math.round(selection.crop.y * scale),
			previous.y + previous.height - height
		),
		width,
		height
	};
}
