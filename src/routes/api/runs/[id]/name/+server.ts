import { json } from '@sveltejs/kit';
import { runErrorResponse, runIdParam } from '$lib/server/runs';
import { nameRunScore } from '$lib/server/scores';

/**
 * `{ name }` → the finished run's score gets that name, if it has none yet (10c-1: the first
 * run's result screen). 400 with `problem` for a refused name, 404 for no such score, 409 for a
 * score that is named already
 */
export async function POST({ params, request }) {
	try {
		const id = runIdParam(params.id);
		const { name } = await request.json();
		const result = await nameRunScore(id, name);
		if (result.ok) return json({ name: result.name });
		if (result.problem === 'notFound')
			return json({ error: 'no score for this run' }, { status: 404 });
		if (result.problem === 'named') return json({ error: 'score already named' }, { status: 409 });
		return json({ error: 'name refused', problem: result.problem }, { status: 400 });
	} catch (err) {
		return runErrorResponse(err);
	}
}
