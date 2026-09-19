import { fail, redirect } from '@sveltejs/kit';
import { createGame, slugify, uniqueSlug } from '$lib/server/games';
import { getRecentGames, getRecentScores, getStats } from '$lib/server/stats';
import type { Actions, PageServerLoad } from './$types';

const EARLIEST_YEAR = 1958;

export const load: PageServerLoad = async () => {
	try {
		const [stats, recentScores, recentGames] = await Promise.all([
			getStats(),
			getRecentScores(),
			getRecentGames()
		]);
		return { stats, recentScores, recentGames, error: null };
	} catch (err) {
		console.error('Could not load the dashboard:', err);
		return {
			stats: null,
			recentScores: [],
			recentGames: [],
			error: 'The database is unavailable — check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.'
		};
	}
};

export const actions: Actions = {
	quickAdd: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const year = Number(form.get('year'));

		if (!name) return fail(400, { error: 'A name is required.' });
		if (!Number.isInteger(year) || year < EARLIEST_YEAR || year > new Date().getFullYear() + 2) {
			return fail(400, { error: `The year must be between ${EARLIEST_YEAR} and now.` });
		}

		let id: number;
		try {
			id = await createGame(name, year, await uniqueSlug(slugify(name)));
		} catch (err) {
			console.error('Quick add failed:', err);
			return fail(500, { error: 'Could not save the game.' });
		}

		redirect(303, `/admin/games/${id}/`);
	}
};
