import { del, put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';

/**
 * Upload conventions for the public store `geekster-screenshots` (fra1).
 *
 * A screenshot's pathname is `screenshots/<random>.<ext>` and never names the
 * game (Sprint 10a): the image URL is the one thing a player sees before
 * placing a card, so a slug in it gave the answer away in the network panel.
 * Every upload is a new screenshot row and gets a pathname that has never
 * existed. `scripts/migrate-screenshots-to-blob.js` (seed images) and
 * `scripts/rename-screenshot-blobs.js` (the 10a re-upload) follow the same rule.
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

const STAGING_PREFIX = 'staging/';

/** `VERCEL_ENV` is absent locally, so local work counts as non-production. */
function isProductionRuntime(): boolean {
	return env.VERCEL_ENV === 'production';
}

/**
 * There is one blob store for every stage. Everything outside production is
 * written under a prefix of its own, which is how `ownsBlob()` tells the
 * stages' files apart.
 */
function pathPrefix(): string {
	return isProductionRuntime() ? '' : STAGING_PREFIX;
}

/**
 * A stage may only delete the blobs it can create.
 *
 * Staging is allowed to hold production's absolute blob URLs — that is what
 * makes a one-way refresh from production cheap, since no image has to be
 * copied. Without this check, deleting such a game in the staging admin panel
 * would delete the live image out from under production. The guard is
 * symmetric: production will not delete a `staging/` blob either.
 */
function ownsBlob(url: string): boolean {
	let pathname: string;
	try {
		pathname = new URL(url).pathname.replace(/^\//, '');
	} catch {
		return false;
	}

	return pathname.startsWith(STAGING_PREFIX) !== isProductionRuntime();
}

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
 * Stores an image as `screenshots/<random>.<ext>` and returns its absolute
 * URL. Outside production the pathname is prefixed with `staging/`.
 *
 * The name says nothing about the game (see the top of this file), and it is
 * never reused: deterministic names collided across games and with the
 * year-long cache (a replacement stored under a deleted shot's name keeps
 * showing the old image for up to a year).
 */
export async function uploadScreenshot(
	data: Blob | ArrayBuffer | Buffer,
	contentType: string
): Promise<string> {
	const pathname = `${pathPrefix()}screenshots/${randomUUID().replaceAll('-', '')}.${extensionFor(contentType)}`;

	const result = await put(pathname, data, {
		access: 'public', // required — the store is public and cannot be switched later
		addRandomSuffix: false, // the name is random already — see above
		allowOverwrite: false,
		contentType,
		cacheControlMaxAge: 31536000,
		token: blobToken()
	});

	return result.url;
}

/**
 * Deletes a blob file. Local paths (`/screenshots/...`, from the seed data) are
 * ignored — those files live in the repository and are not ours to remove — and
 * so is any blob belonging to another stage.
 */
export async function deleteScreenshotBlob(url: string): Promise<void> {
	if (!BLOB_HOST.test(url)) return;

	if (!ownsBlob(url)) {
		// Orphaning a row's file is recoverable; deleting another stage's is not.
		console.warn(`Refusing to delete a blob owned by another stage: ${url}`);
		return;
	}

	try {
		await del(url, { token: blobToken() });
	} catch (err) {
		// A missing blob must not block deleting the database row.
		console.error(`Could not delete blob ${url}:`, err);
	}
}
