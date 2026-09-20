import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { games, screenshots } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';

export async function GET() {
	try {
		const allGames = await db
			.select({
				id: games.id,
				name: games.name,
				year: games.year,
				screenshot: screenshots.url
			})
			.from(games)
			.innerJoin(screenshots, eq(screenshots.gameId, games.id))
			// Live means published AND has a primary screenshot. A draft is
			// invisible to players however complete it looks in the admin panel.
			.where(and(eq(screenshots.isPrimary, 1), eq(games.published, 1)));

		return json(allGames);
	} catch {
		return json({ error: 'Database not available' }, { status: 503 });
	}
}
