import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

export const ADMIN_COOKIE = 'geekster_admin';

/** How long a login lasts before the admin has to enter the password again. */
const SESSION_TTL_SECONDS = 60 * 60 * 12;

/**
 * The admin password doubles as the signing key: changing it in the Vercel
 * dashboard invalidates every issued session, which is the behaviour we want
 * from a single-operator panel. Set `ADMIN_PASSWORD` per environment — when it
 * is missing, the admin area is closed rather than open.
 */
function adminPassword(): string | null {
	const value = env.ADMIN_PASSWORD?.trim();
	return value ? value : null;
}

export function isAdminConfigured(): boolean {
	return adminPassword() !== null;
}

/** Constant-time string comparison that tolerates differing lengths. */
function equals(a: string, b: string): boolean {
	const left = Buffer.from(a, 'utf8');
	const right = Buffer.from(b, 'utf8');
	if (left.length !== right.length) {
		// Still burn a comparison so the failure takes the same shape.
		timingSafeEqual(left, left);
		return false;
	}
	return timingSafeEqual(left, right);
}

export function verifyPassword(candidate: string): boolean {
	const password = adminPassword();
	if (!password) return false;
	return equals(candidate, password);
}

function sign(payload: string, password: string): string {
	return createHmac('sha256', password).update(payload).digest('hex');
}

/** Returns a `<expiry>.<signature>` token, or null if no password is configured. */
export function createSessionToken(): string | null {
	const password = adminPassword();
	if (!password) return null;

	const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
	return `${expiresAt}.${sign(String(expiresAt), password)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
	const password = adminPassword();
	if (!password || !token) return false;

	const [expiry, signature] = token.split('.');
	if (!expiry || !signature) return false;

	const expiresAt = Number(expiry);
	if (!Number.isFinite(expiresAt) || expiresAt * 1000 < Date.now()) return false;

	return equals(signature, sign(expiry, password));
}

export const sessionCookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: process.env.NODE_ENV === 'production',
	maxAge: SESSION_TTL_SECONDS
} as const;
