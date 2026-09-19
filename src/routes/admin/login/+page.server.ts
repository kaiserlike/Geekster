import { fail, redirect } from '@sveltejs/kit';
import {
	ADMIN_COOKIE,
	createSessionToken,
	isAdminConfigured,
	sessionCookieOptions,
	verifyPassword
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

/** Only ever bounce back into the admin area — never to an attacker-supplied URL. */
function safeTarget(raw: string | null): string {
	if (!raw || !raw.startsWith('/admin') || raw.startsWith('//')) return '/admin/';
	return raw;
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.admin) redirect(303, safeTarget(url.searchParams.get('redirectTo')));
	return { configured: isAdminConfigured() };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const password = String(form.get('password') ?? '');

		if (!isAdminConfigured()) {
			return fail(503, { error: 'ADMIN_PASSWORD is not set for this environment.' });
		}

		if (!verifyPassword(password)) {
			return fail(401, { error: 'Wrong password.' });
		}

		const token = createSessionToken();
		if (!token) return fail(503, { error: 'Could not create a session.' });

		cookies.set(ADMIN_COOKIE, token, sessionCookieOptions);
		redirect(303, safeTarget(url.searchParams.get('redirectTo')));
	}
};
