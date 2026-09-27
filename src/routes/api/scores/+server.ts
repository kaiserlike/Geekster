import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scores } from '$lib/server/schema';
import { desc, eq } from 'drizzle-orm';
import { isDifficulty, parseDifficulty } from '$lib/screenshotTiers';
import { getProGate } from '$lib/server/liveGames';

export async function GET({ url }) {
	const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10), 1), 100);

	// `?difficulty=normal|pro` splits the board by mode; without it, every mode as before.
	const difficulty = url.searchParams.get('difficulty');
	if (difficulty !== null && !isDifficulty(difficulty)) {
		return json({ error: 'difficulty must be normal or pro' }, { status: 400 });
	}

	try {
		const topScores = await db
			.select()
			.from(scores)
			.where(difficulty ? eq(scores.difficulty, difficulty) : undefined)
			.orderBy(desc(scores.totalScore))
			.limit(limit);

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

	// Only `normal | pro` is stored. Anything else — including the `medium` a
	// browser tab loaded before migration 0003 still sends — is `normal`.
	const mode = parseDifficulty(difficulty);

	try {
		// No Pro score while Pro is gated: the random API would not have served the
		// run, and a row in the Pro board could only be removed by hand.
		if (mode === 'pro' && !(await getProGate()).open) {
			return json({ error: 'Pro is not open yet' }, { status: 409 });
		}

		const [inserted] = await db
			.insert(scores)
			.values({
				playerName: String(playerName).slice(0, 50),
				totalScore,
				correctPlacements: correctPlacements ?? null,
				wrongPlacements: wrongPlacements ?? null,
				bestStreak: bestStreak ?? null,
				difficulty: mode
			})
			.returning();

		return json(inserted, { status: 201 });
	} catch {
		return json({ error: 'Database not available' }, { status: 503 });
	}
}
