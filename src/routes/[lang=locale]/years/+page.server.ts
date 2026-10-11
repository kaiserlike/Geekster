import { YEAR_TEXTS } from '$lib/content/years';
import { groupByDecade, writtenYears } from '$lib/encyclopedia';
import { db } from '$lib/server/db';
import { ENCYCLOPEDIA_CACHE, liveGamesPerYear } from '$lib/server/encyclopedia';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const years = writtenYears(YEAR_TEXTS);
	const games = await liveGamesPerYear(db, years);
	setHeaders({ 'cache-control': ENCYCLOPEDIA_CACHE });
	return {
		decades: groupByDecade(years.map((year) => ({ year, games: games.get(year) ?? 0 })))
	};
};
