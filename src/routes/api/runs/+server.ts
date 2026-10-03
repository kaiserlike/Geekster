import { json } from '@sveltejs/kit';
import { createRun, runErrorResponse } from '$lib/server/runs';
import { isDifficulty } from '$lib/screenshotTiers';

/** Starts a run: `{ mode }` → the run's id, the anchor, the first card (its image only) */
export async function POST({ request }) {
	try {
		const { mode } = await request.json();
		if (!isDifficulty(mode)) return json({ error: 'mode must be normal or pro' }, { status: 400 });
		return json(await createRun(mode), { status: 201 });
	} catch (err) {
		return runErrorResponse(err);
	}
}
