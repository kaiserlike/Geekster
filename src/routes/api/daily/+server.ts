import { json } from '@sveltejs/kit';
import { dailyStatus, DailyUnavailable } from '$lib/server/daily';
import { parseDeviceId } from '$lib/globalBoard';

/**
 * Today's Daily Run for the welcome screen (Sprint 10d): its number, the time until the next,
 * and with `?device=<id>` that device's streak and its run of today (none, unfinished, or the
 * result with its rank). The first request of a UTC day draws the day's set
 */
export async function GET({ url }) {
	try {
		return json(await dailyStatus(parseDeviceId(url.searchParams.get('device'))));
	} catch (err) {
		if (err instanceof DailyUnavailable) return json({ error: 'no daily today' }, { status: 503 });
		console.error('daily status failed:', err);
		return json({ error: 'Database not available' }, { status: 503 });
	}
}
