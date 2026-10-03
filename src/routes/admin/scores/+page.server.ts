import { fail } from '@sveltejs/kit';
import { deleteScore, listScores } from '$lib/server/scores';
import { isDifficulty } from '$lib/screenshotTiers';
import type { Actions, PageServerLoad } from './$types';

// The global board's rows, for the one thing the operator does with them (Sprint 10c): delete a
// row whose name should not be on the board. A deleted row stays deleted; its run is kept

export const load: PageServerLoad = async ({ url }) => {
	const mode = url.searchParams.get('mode');
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 40);
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const query = { mode: isDifficulty(mode) ? mode : null, q, page };
	return { query, ...(await listScores(query)) };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id) || id <= 0) return fail(400, { error: 'No such score.' });
		try {
			if (!(await deleteScore(id))) return fail(404, { error: 'That score is already gone.' });
			return { deleted: id };
		} catch (err) {
			console.error('Could not delete score:', err);
			return fail(500, { error: 'Could not delete the score.' });
		}
	}
};
