import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { games, screenshots } from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET({ url }) {
	const count = Math.min(Math.max(parseInt(url.searchParams.get('count') ?? '14', 10), 1), 50);

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
			.where(eq(screenshots.isPrimary, 1))
			.orderBy(sql`RANDOM()`)
			.limit(count);

		return json(randomGames);
	} catch {
		// Database not seeded yet — return 503 so frontend falls back to static JSON
		return json({ error: 'Database not available' }, { status: 503 });
	}
}
