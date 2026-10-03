import { json } from '@sveltejs/kit';
import { intField, placeCard, runErrorResponse, runIdParam } from '$lib/server/runs';

/** Places the card at `position` into `slot`: the verdict, and the answer only on a miss */
export async function POST({ params, request }) {
	try {
		const id = runIdParam(params.id);
		const body = await request.json();
		return json(await placeCard(id, intField(body, 'position'), intField(body, 'slot')));
	} catch (err) {
		return runErrorResponse(err);
	}
}
