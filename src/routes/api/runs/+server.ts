import { json } from '@sveltejs/kit';
import { createRun, runErrorResponse } from '$lib/server/runs';
import { isDifficulty } from '$lib/screenshotTiers';
import { parseDeviceId } from '$lib/globalBoard';

/**
 * Starts a run: `{ mode, deviceId? }`. `mode: 'daily'` (10d) needs the device id: it starts
 * today's Daily Run, picks up the device's unfinished one (`resume`), or answers 409 once played. → the run's id, the anchor, the first card (its image only).
 * A missing or malformed device id plays all the same; its score is then a player of its own
 */
export async function POST({ request }) {
	try {
		const { mode, deviceId } = await request.json();
		if (!isDifficulty(mode) && mode !== 'daily') {
			return json({ error: 'mode must be normal, pro or daily' }, { status: 400 });
		}
		return json(await createRun(mode, parseDeviceId(deviceId)), { status: 201 });
	} catch (err) {
		return runErrorResponse(err);
	}
}
