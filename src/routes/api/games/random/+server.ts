import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import {
	countLiveGames,
	difficultyParam,
	proMinPool,
	selectLiveGames
} from '$lib/server/liveGames';
import { isProOpen } from '$lib/modes';

// A solo run is endless and asks for the whole live pool in one request, so the cap
// is the pool size we are willing to ship at once, not a round length.
const MAX_COUNT = 1000;

export async function GET({ url }) {
	const requested = parseInt(url.searchParams.get('count') ?? '14', 10);
	const count = Math.min(Math.max(Number.isNaN(requested) ? 14 : requested, 1), MAX_COUNT);

	const difficulty = difficultyParam(url);
	if (!difficulty) return json({ error: 'difficulty must be normal or pro' }, { status: 400 });

	try {
		// Live means published AND a primary screenshot of this tier.
		const randomGames = await selectLiveGames(difficulty)
			.orderBy(sql`RANDOM()`)
			.limit(count);

		// The Pro gate, enforced here as well as on the welcome screen, so a stale tab
		// or a typed URL cannot start a Pro run on a pool too small to be one. A solo
		// run asks for more than the whole pool, so the answer's length is the live
		// count; only a request the limit cut short needs the extra `COUNT`.
		if (difficulty === 'pro') {
			const live = randomGames.length < count ? randomGames.length : await countLiveGames('pro');
			if (!isProOpen(live, proMinPool())) {
				return json({ error: 'Pro is not open yet' }, { status: 409 });
			}
		}

		return json(randomGames);
	} catch {
		// The database is the only source of games — the client shows an error and retries.
		return json({ error: 'Database not available' }, { status: 503 });
	}
}
