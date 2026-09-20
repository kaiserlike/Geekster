import { json, redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { ADMIN_COOKIE, verifySessionToken } from '$lib/server/auth';

const LOGIN_PATH = '/admin/login';

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

	const response = await resolve(event);
	if (!isProduction) response.headers.set('X-Robots-Tag', 'noindex, nofollow');

	return response;
};
