import { json } from '@sveltejs/kit';
import { intField, nextCard, runErrorResponse, runIdParam } from '$lib/server/runs';

/**
 * After the card at `position`: the next card (its image only), or the end, with the score written
 * under `name` (the browser's display name, if it has one) and the device's standing
 */
export async function POST({ params, request }) {
	try {
		const id = runIdParam(params.id);
		const body = await request.json();
		return json(await nextCard(id, intField(body, 'position'), body.name));
	} catch (err) {
		return runErrorResponse(err);
	}
}
