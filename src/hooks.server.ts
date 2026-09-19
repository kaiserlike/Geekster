import { json, redirect, type Handle } from '@sveltejs/kit';
import { ADMIN_COOKIE, verifySessionToken } from '$lib/server/auth';

const LOGIN_PATH = '/admin/login';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.admin = verifySessionToken(event.cookies.get(ADMIN_COOKIE));

	const path = event.url.pathname;

	if (path.startsWith('/api/admin') && !event.locals.admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (path.startsWith('/admin') && !path.startsWith(LOGIN_PATH) && !event.locals.admin) {
		redirect(303, `${LOGIN_PATH}/?redirectTo=${encodeURIComponent(path)}`);
	}

	return resolve(event);
};
