import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scores } from '$lib/server/schema';
import { desc, eq } from 'drizzle-orm';
import { isDifficulty } from '$lib/screenshotTiers';

export async function GET({ url }) {
	const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10), 1), 100);

	// `?difficulty=normal|pro` splits the board by mode; without it, every mode as before.
	const difficulty = url.searchParams.get('difficulty');
	if (difficulty !== null && !isDifficulty(difficulty)) {
		return json({ error: 'difficulty must be normal or pro' }, { status: 400 });
	}

	try {
		// The board's columns only: `run_id` and `device_id` stay on the server
		const topScores = await db
			.select({
				id: scores.id,
				playerName: scores.playerName,
				totalScore: scores.totalScore,
				correctPlacements: scores.correctPlacements,
				wrongPlacements: scores.wrongPlacements,
				bestStreak: scores.bestStreak,
				difficulty: scores.difficulty,
				createdAt: scores.createdAt
			})
			.from(scores)
			.where(difficulty ? eq(scores.difficulty, difficulty) : undefined)
			.orderBy(desc(scores.totalScore))
			.limit(limit);

		return json(topScores);
	} catch {
		return json({ error: 'Database not available' }, { status: 503 });
	}
}

// There is no POST: since Sprint 10b a score is written by the server at the end of a refereed
// run (`nextCard()` in `$lib/server/runs.ts`), never sent by a client.
