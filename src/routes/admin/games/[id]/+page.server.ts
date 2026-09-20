import { error, fail, redirect } from '@sveltejs/kit';
import { gameListQueryString, parseGameListQuery } from '$lib/adminList';
import {
	deleteScreenshotBlob,
	isAcceptedImageType,
	isBlobConfigured,
	uploadScreenshot
} from '$lib/server/blob';
import {
	DIFFICULTIES,
	addScreenshot,
	deleteGame,
	deleteScreenshot,
	getGame,
	getGameNeighbours,
	setPrimaryScreenshot,
	setScreenshotDifficulty,
	slugify,
	uniqueSlug,
	updateGame
} from '$lib/server/games';
import { fetchRawgImage, isRawgConfigured } from '$lib/server/rawg';
import type { Difficulty } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

const EARLIEST_YEAR = 1958;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

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

	// Once a screenshot is added the game drops out of a "missing" filter, which
	// would strand prev/next — fall back to the unfiltered order in that case.
	let neighbours = await getGameNeighbours(id, query);
	if (neighbours.position === 0 && query.onlyMissing) {
		neighbours = await getGameNeighbours(id, { ...query, onlyMissing: false });
	}

	return {
		game,
		query,
		neighbours,
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

		if (!(file instanceof File) || file.size === 0) return fail(400, { error: 'Choose a file.' });
		if (!isAcceptedImageType(file.type)) {
			return fail(400, { error: `${file.type || 'That file type'} is not a supported image.` });
		}
		if (file.size > MAX_UPLOAD_BYTES) return fail(400, { error: 'The image is larger than 8 MB.' });

		try {
			const url = await uploadScreenshot(game.slug, file, file.type, game.screenshots.length);
			await addScreenshot(id, url);
			return { uploaded: true };
		} catch (err) {
			console.error('Could not upload screenshot:', err);
			return fail(500, { error: 'The upload failed.' });
		}
	},

	rawgImport: async ({ request, params }) => {
		const id = gameId(params);
		const game = await getGame(id);
		if (!game) return fail(404, { error: 'Game not found.' });

		const form = await request.formData();
		const imageUrl = String(form.get('imageUrl') ?? '');

		try {
			const { data, contentType } = await fetchRawgImage(imageUrl);
			const url = await uploadScreenshot(game.slug, data, contentType, game.screenshots.length);
			await addScreenshot(id, url);
			return { uploaded: true };
		} catch (err) {
			console.error('Could not import the RAWG screenshot:', err);
			return fail(502, { error: 'Could not import that screenshot.' });
		}
	},

	difficulty: async ({ request }) => {
		const form = await request.formData();
		const screenshotId = Number(form.get('screenshotId'));
		const difficulty = String(form.get('difficulty')) as Difficulty;

		if (!Number.isInteger(screenshotId) || !DIFFICULTIES.includes(difficulty)) {
			return fail(400, { error: 'Invalid difficulty.' });
		}

		await setScreenshotDifficulty(screenshotId, difficulty);
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

	deleteScreenshot: async ({ request }) => {
		const form = await request.formData();
		const screenshotId = Number(form.get('screenshotId'));
		if (!Number.isInteger(screenshotId)) return fail(400, { error: 'Invalid screenshot.' });

		const url = await deleteScreenshot(screenshotId);
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
