import { json } from '@sveltejs/kit';
import { difficultyParam, selectLiveGames } from '$lib/server/liveGames';

export async function GET({ url }) {
	const difficulty = difficultyParam(url);
	if (!difficulty) return json({ error: 'difficulty must be normal or pro' }, { status: 400 });

	try {
		// Live means published AND a primary screenshot of this tier. A draft is
		// invisible to players however complete it looks in the admin panel.
		return json(await selectLiveGames(difficulty));
	} catch {
		return json({ error: 'Database not available' }, { status: 503 });
	}
}
