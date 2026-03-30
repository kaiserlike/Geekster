import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scores } from '$lib/server/schema';
import { desc } from 'drizzle-orm';

export async function GET({ url }) {
	const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10), 1), 100);

	try {
		const topScores = await db.select().from(scores).orderBy(desc(scores.totalScore)).limit(limit);

		return json(topScores);
	} catch {
		return json({ error: 'Database not available' }, { status: 503 });
	}
}

export async function POST({ request }) {
	const body = await request.json();
	const { playerName, totalScore, correctPlacements, wrongPlacements, bestStreak, difficulty } =
		body;

	if (!playerName || typeof totalScore !== 'number') {
		return json({ error: 'Invalid score data' }, { status: 400 });
	}

	try {
		const [inserted] = await db
			.insert(scores)
			.values({
				playerName: String(playerName).slice(0, 50),
				totalScore,
				correctPlacements: correctPlacements ?? null,
				wrongPlacements: wrongPlacements ?? null,
				bestStreak: bestStreak ?? null,
				difficulty: difficulty ?? 'medium'
			})
			.returning();

		return json(inserted, { status: 201 });
	} catch {
		return json({ error: 'Database not available' }, { status: 503 });
	}
}
