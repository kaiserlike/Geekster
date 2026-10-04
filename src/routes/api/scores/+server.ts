import { json } from '@sveltejs/kit';
import { boardPage } from '$lib/server/scores';
import { isBoardMode, isBoardPeriod, parseDeviceId, parsePage } from '$lib/globalBoard';

/**
 * One page of the global board (Sprint 10c): each player's best run in a mode.
 * `?difficulty=normal|pro|daily` (default normal; `daily` = today's Daily Run, 10d, the period
 * ignored), `period=all|week` (default all), `page=N`, and
 * `device=<id>` to have that device's rows marked `mine`. The rows carry the board's columns
 * only: `run_id` and `device_id` stay on the server
 */
export async function GET({ url }) {
	const difficulty = url.searchParams.get('difficulty') ?? 'normal';
	if (!isBoardMode(difficulty)) {
		return json({ error: 'difficulty must be normal, pro or daily' }, { status: 400 });
	}
	const period = url.searchParams.get('period') ?? 'all';
	if (!isBoardPeriod(period)) return json({ error: 'period must be all or week' }, { status: 400 });

	try {
		return json(
			await boardPage({
				mode: difficulty,
				period,
				page: parsePage(url.searchParams.get('page')),
				deviceId: parseDeviceId(url.searchParams.get('device'))
			})
		);
	} catch (err) {
		console.error('board failed:', err);
		return json({ error: 'Database not available' }, { status: 503 });
	}
}

// There is no POST: a score is written by the server at the end of a refereed run (`nextCard()`
// in `$lib/server/runs.ts`, Sprint 10b) and named through `POST /api/runs/:id/name` (10c).
