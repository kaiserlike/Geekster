import { fail } from '@sveltejs/kit';
import { deleteScreenshotBlob } from '$lib/server/blob';
import { deleteGame, listGames, type GameSort, type SortDirection } from '$lib/server/games';
import type { Actions, PageServerLoad } from './$types';

const SORTS: GameSort[] = ['name', 'year', 'created'];

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q') ?? '';
	const sortParam = url.searchParams.get('sort');
	const sort: GameSort = SORTS.includes(sortParam as GameSort) ? (sortParam as GameSort) : 'year';
	const direction: SortDirection = url.searchParams.get('dir') === 'desc' ? 'desc' : 'asc';

	try {
		return {
			games: await listGames(search, sort, direction),
			search,
			sort,
			direction,
			error: null
		};
	} catch (err) {
		console.error('Could not list games:', err);
		return {
			games: [],
			search,
			sort,
			direction,
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
