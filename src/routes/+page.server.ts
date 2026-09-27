import { getProGate } from '$lib/server/liveGames';
import type { PageServerLoad } from './$types';

// The welcome screen needs to know whether Pro is open before it is drawn, so
// "Coming soon" is in the first HTML. One COUNT — the pool itself is fetched
// only when a run starts. A database error reads as closed, never as a failure.
export const load: PageServerLoad = async () => ({ proGate: await getProGate() });
