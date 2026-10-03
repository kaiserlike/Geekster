import { json } from '@sveltejs/kit';
import { intField, runErrorResponse, runIdParam, submitBonus } from '$lib/server/runs';
import { parseGuess } from '$lib/server/runRules';

/**
 * The bonus guess for the card at `position` (both fields null to skip): the card's name and
 * year, and the round's score. A guess after the server's deadline counts as skipped.
 */
export async function POST({ params, request }) {
	try {
		const id = runIdParam(params.id);
		const body = await request.json();
		return json(await submitBonus(id, intField(body, 'position'), parseGuess(body ?? {})));
	} catch (err) {
		return runErrorResponse(err);
	}
}
