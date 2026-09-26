import { error, fail, redirect } from '@sveltejs/kit';
import { gameListQueryString, parseGameListQuery } from '$lib/adminList';
import {
	deleteScreenshotBlob,
	isAcceptedImageType,
	isBlobConfigured,
	uploadScreenshot
} from '$lib/server/blob';
import {
	addScreenshot,
	deleteGame,
	deleteScreenshot,
	getGame,
	getGameNeighbours,
	moveScreenshot,
	replaceScreenshotImage,
	setGamePublished,
	setPrimaryScreenshot,
	slugify,
	uniqueSlug,
	updateGame
} from '$lib/server/games';
import { isRawgConfigured, rawgSourceUrl } from '$lib/server/rawg';
import { parseCrop, parseCropSelection, recropFromStored } from '$lib/crop';
import { isDifficulty } from '$lib/screenshotTiers';
import type { Actions, PageServerLoad } from './$types';

const EARLIEST_YEAR = 1958;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * What `/admin/games/new` could not finish. It creates the game first and the
 * screenshot second, so a failed upload leaves a real game and sends the
 * operator here to retry. A closed set of codes, not a message in the URL:
 * nothing arbitrary should be renderable on an admin page.
 */
const WARNINGS: Record<string, string> = {
	'screenshot-type': 'The game was created, but that file is not a supported image type.',
	'screenshot-size': 'The game was created, but the image was larger than 8 MB.',
	'screenshot-failed': 'The game was created, but the screenshot could not be uploaded.'
};

function gameId(params: { id: string }): number {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) error(404, 'Not found');
	return id;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const id = gameId(params);
	const game = await getGame(id);
	if (!game) error(404, 'Game not found');

	// The list's own order travels in the query string, so prev/next walks the
	// same set the operator was just looking at.
	const query = parseGameListQuery(url.searchParams);

	// Acting on a game can drop it out of the filter it was reached through —
	// adding a screenshot leaves a "missing" list, publishing leaves a "draft"
	// one — which would strand prev/next. Fall back to the unfiltered order.
	let neighbours = await getGameNeighbours(id, query);
	if (neighbours.position === 0 && (query.missing || query.status !== 'all')) {
		neighbours = await getGameNeighbours(id, { ...query, missing: null, status: 'all' });
	}

	return {
		game,
		query,
		neighbours,
		warning: WARNINGS[url.searchParams.get('warning') ?? ''] ?? null,
		rawgConfigured: isRawgConfigured(),
		blobConfigured: isBlobConfigured()
	};
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const id = gameId(params);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const year = Number(form.get('year'));
		const slugInput = String(form.get('slug') ?? '').trim();

		if (!name) return fail(400, { error: 'A name is required.' });
		if (!Number.isInteger(year) || year < EARLIEST_YEAR || year > new Date().getFullYear() + 2) {
			return fail(400, { error: `The year must be between ${EARLIEST_YEAR} and now.` });
		}

		try {
			const slug = await uniqueSlug(slugify(slugInput || name), id);
			await updateGame(id, name, year, slug);
			return { saved: true };
		} catch (err) {
			console.error('Could not update game:', err);
			return fail(500, { error: 'Could not save the changes.' });
		}
	},

	upload: async ({ request, params }) => {
		const id = gameId(params);
		const game = await getGame(id);
		if (!game) return fail(404, { error: 'Game not found.' });

		const form = await request.formData();
		const file = form.get('screenshot');
		const difficulty = form.get('difficulty');

		if (!(file instanceof File) || file.size === 0) return fail(400, { error: 'Choose a file.' });
		if (!isDifficulty(difficulty)) return fail(400, { error: 'Choose Normal or Pro.' });
		if (!isAcceptedImageType(file.type)) {
			return fail(400, { error: `${file.type || 'That file type'} is not a supported image.` });
		}
		if (file.size > MAX_UPLOAD_BYTES) return fail(400, { error: 'The image is larger than 8 MB.' });

		let sourceUrl = rawgSourceUrl(form.get('sourceUrl'));
		let crop = parseCrop(form);
		let replacing: number | null = null;

		// A re-crop of an existing shot (US-8.8). Its source comes from the row,
		// never from the form, and where the crop was drawn decides how it is kept.
		if (form.has('recropOf')) {
			const shot = game.screenshots.find((s) => s.id === Number(form.get('recropOf')));
			if (!shot) return fail(400, { error: 'That screenshot is not part of this game.' });

			sourceUrl = shot.sourceUrl;
			const selection = parseCropSelection(form);
			if (form.get('cropBase') === 'source') {
				// Drawn on the RAWG original again: the same pixel space as before.
				crop = shot.sourceUrl ? (selection?.crop ?? null) : null;
			} else {
				// Drawn on the stored WebP: mapped back into the original's pixels.
				// A RAWG shot without a crop has no stored-pixel meaning to map from.
				crop =
					selection && (shot.crop || !shot.sourceUrl)
						? recropFromStored(shot.crop, selection)
						: null;
			}
			if (form.get('replace') === '1') replacing = shot.id;
		}

		// Adding to a slot that already has a primary: the operator may ask for the
		// new shot to take over. The old one stays as an extra, nothing is deleted.
		const makePrimary = form.get('makePrimary') === '1';

		try {
			const url = await uploadScreenshot(game.slug, file, file.type);
			let screenshotId: number;
			if (replacing !== null) {
				const previous = await replaceScreenshotImage(id, replacing, url, crop);
				if (previous) await deleteScreenshotBlob(previous);
				screenshotId = replacing;
			} else {
				screenshotId = await addScreenshot(id, url, difficulty, sourceUrl, crop);
				if (makePrimary) await setPrimaryScreenshot(id, screenshotId);
			}
			return { uploaded: true, screenshotId };
		} catch (err) {
			console.error('Could not upload screenshot:', err);
			return fail(500, { error: 'The upload failed.' });
		}
	},

	move: async ({ request, params }) => {
		const id = gameId(params);
		const form = await request.formData();
		const screenshotId = Number(form.get('screenshotId'));
		const difficulty = form.get('difficulty');

		if (!Number.isInteger(screenshotId) || !isDifficulty(difficulty)) {
			return fail(400, { error: 'Invalid move.' });
		}

		await moveScreenshot(id, screenshotId, difficulty);
		return { saved: true };
	},

	primary: async ({ request, params }) => {
		const id = gameId(params);
		const form = await request.formData();
		const screenshotId = Number(form.get('screenshotId'));
		if (!Number.isInteger(screenshotId)) return fail(400, { error: 'Invalid screenshot.' });

		await setPrimaryScreenshot(id, screenshotId);
		return { saved: true };
	},

	publish: async ({ request, params }) => {
		const id = gameId(params);
		const form = await request.formData();
		// The button sends the state it wants, not a toggle, so a double submit
		// cannot flip a game back to where it started.
		const published = form.get('published') === '1';

		try {
			await setGamePublished(id, published);
			return { saved: true };
		} catch (err) {
			console.error('Could not change the published state:', err);
			return fail(500, { error: 'Could not change the published state.' });
		}
	},

	deleteScreenshot: async ({ request, params }) => {
		const id = gameId(params);
		const form = await request.formData();
		const screenshotId = Number(form.get('screenshotId'));
		if (!Number.isInteger(screenshotId)) return fail(400, { error: 'Invalid screenshot.' });

		const url = await deleteScreenshot(id, screenshotId);
		if (url) await deleteScreenshotBlob(url);
		return { saved: true };
	},

	delete: async ({ params, url }) => {
		const id = gameId(params);
		try {
			const urls = await deleteGame(id);
			await Promise.all(urls.map(deleteScreenshotBlob));
		} catch (err) {
			console.error('Could not delete game:', err);
			return fail(500, { error: 'Could not delete the game.' });
		}
		// Back to the list the operator came from, filter and sort intact.
		redirect(303, `/admin/games/${gameListQueryString(parseGameListQuery(url.searchParams))}`);
	}
};
