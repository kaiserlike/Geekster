import { json } from '@sveltejs/kit';
import { createRun, runErrorResponse } from '$lib/server/runs';
import { isDifficulty } from '$lib/screenshotTiers';
import { parseDeviceId } from '$lib/globalBoard';

/**
 * Starts a run: `{ mode, deviceId? }` → the run's id, the anchor, the first card (its image only).
 * A missing or malformed device id plays all the same; its score is then a player of its own
 */
export async function POST({ request }) {
	try {
		const { mode, deviceId } = await request.json();
		if (!isDifficulty(mode)) return json({ error: 'mode must be normal or pro' }, { status: 400 });
		return json(await createRun(mode, parseDeviceId(deviceId)), { status: 201 });
	} catch (err) {
		return runErrorResponse(err);
	}
}
