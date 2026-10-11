import type { Reroute } from '@sveltejs/kit';
import { routePath } from '$lib/localizedPaths';

/** `/de/jahre/…` is served by `src/routes/[lang=locale]/years/…` (decision 12-1) */
export const reroute: Reroute = ({ url }) => routePath(url.pathname) ?? undefined;
