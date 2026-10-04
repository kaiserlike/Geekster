import { json } from '@sveltejs/kit';
import { parseShareEvent } from '$lib/share';
import { countShare } from '$lib/server/shareCounts';

/**
 * `{ kind, method }` → today's count for it goes up by one (Sprint 10f). Anonymous: no device,
 * no run, nothing stored but the count. 204, or 400 for an unknown kind or method
 */
export async function POST({ request }) {
	const event = parseShareEvent(await request.json().catch(() => null));
	if (!event) return json({ error: 'unknown share' }, { status: 400 });
	try {
		await countShare(event);
	} catch (err) {
		console.error('Could not count a share:', err);
		return json({ error: 'not counted' }, { status: 500 });
	}
	return new Response(null, { status: 204 });
}
