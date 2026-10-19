import { json, redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { ADMIN_COOKIE, verifySessionToken } from '$lib/server/auth';
import { correctedPath, localeOfPath } from '$lib/localizedPaths';

const LOGIN_PATH = '/admin/login';

/**
 * `<html lang>` as the server renders it (`%lang%` in app.html). A page with the language in its
 * URL (the encyclopedia, `/en/years/`) is in that language. The game's language lives in
 * localStorage, which the server cannot read, so it renders its default, German (`loadLocale()`
 * in i18n.svelte.ts); the root layout corrects the attribute after hydration and on every
 * switch. The admin panel is English-only.
 */
const GAME_LANG = 'de';
const ADMIN_LANG = 'en';

/**
 * Vercel's deployment protection exempts only the *production* custom domain,
 * so staging.geekster.pro is behind Vercel Authentication like any other
 * preview. This header is the second lock: if that protection is ever relaxed,
 * a second copy of the game under a different host is exactly the duplicate
 * content that costs the real domain its ranking.
 */
const isProduction = env.VERCEL_ENV === undefined || env.VERCEL_ENV === 'production';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.admin = verifySessionToken(event.cookies.get(ADMIN_COOKIE));

	const path = event.url.pathname;

	if (path.startsWith('/api/admin') && !event.locals.admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (path.startsWith('/admin') && !path.startsWith(LOGIN_PATH) && !event.locals.admin) {
		redirect(303, `${LOGIN_PATH}/?redirectTo=${encodeURIComponent(path)}`);
	}

	// `/de/years/` is `/de/jahre/`: one URL per page and language, or search engines see two
	const corrected = correctedPath(path);
	if (corrected) redirect(301, `${corrected}${event.url.search}`);

	const lang = path.startsWith('/admin') ? ADMIN_LANG : (localeOfPath(path) ?? GAME_LANG);
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
	if (!isProduction || path.startsWith('/admin')) {
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	}

	return response;
};
