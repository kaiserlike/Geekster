import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { games, screenshots } from '$lib/server/schema';
import { and, eq, sql } from 'drizzle-orm';

// A solo run is endless and asks for the whole live pool in one request, so the cap
// is the pool size we are willing to ship at once, not a round length.
const MAX_COUNT = 1000;

export async function GET({ url }) {
	const requested = parseInt(url.searchParams.get('count') ?? '14', 10);
	const count = Math.min(Math.max(Number.isNaN(requested) ? 14 : requested, 1), MAX_COUNT);

	try {
		const randomGames = await db
			.select({
				id: games.id,
				name: games.name,
				year: games.year,
				screenshot: screenshots.url
			})
			.from(games)
			.innerJoin(screenshots, eq(screenshots.gameId, games.id))
			// Live means published AND has a primary screenshot.
			.where(and(eq(screenshots.isPrimary, 1), eq(games.published, 1)))
			.orderBy(sql`RANDOM()`)
			.limit(count);

		return json(randomGames);
	} catch {
		// The database is the only source of games — the client shows an error and retries.
		return json({ error: 'Database not available' }, { status: 503 });
	}
}
