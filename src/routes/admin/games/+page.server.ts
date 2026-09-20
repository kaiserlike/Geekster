import { fail } from '@sveltejs/kit';
import { parseGameListQuery } from '$lib/adminList';
import { deleteScreenshotBlob } from '$lib/server/blob';
import {
	countDraftGames,
	countGamesWithoutScreenshot,
	deleteGame,
	listGames
} from '$lib/server/games';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = parseGameListQuery(url.searchParams);

	try {
		const [games, missingScreenshots, drafts] = await Promise.all([
			listGames(query),
			countGamesWithoutScreenshot(),
			countDraftGames()
		]);

		return { games, query, missingScreenshots, drafts, error: null };
	} catch (err) {
		console.error('Could not list games:', err);
		return {
			games: [],
			query,
			missingScreenshots: 0,
			drafts: 0,
			error: 'The database is unavailable — check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.'
		};
	}
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isInteger(id) || id <= 0) return fail(400, { error: 'Invalid game id.' });

		try {
			const urls = await deleteGame(id);
			await Promise.all(urls.map(deleteScreenshotBlob));
			return { deleted: true };
		} catch (err) {
			console.error('Could not delete game:', err);
			return fail(500, { error: 'Could not delete the game.' });
		}
	}
};
