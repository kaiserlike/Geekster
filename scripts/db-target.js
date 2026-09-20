// Resolves a named stage — local, staging or production — to a database URL and
// auth token. One resolver, shared by `drizzle.config.ts` and
// `stamp-migrations.js`, so that every tool names a stage the same way and gets
// the same guards.
//
// The point of naming the stage is that pointing a migration at production no
// longer means editing `.env`. `TURSO_DATABASE_URL` is what the *application*
// reads, and it stays at `file:local.db` — so the local admin panel, which
// deletes games and blob files, still cannot reach production while a migration
// is being applied to it.
//
//   TURSO_DATABASE_URL             the app, and `db:migrate` with no DB_TARGET
//   TURSO_STAGING_*                `--target=staging`   / DB_TARGET=staging
//   TURSO_PRODUCTION_*             `--target=production`/ DB_TARGET=production

import './load-env.js';

export const TARGETS = ['local', 'staging', 'production'];

const LOCAL_URL = 'file:local.db';

// drizzle-kit's `turso` dialect validates authToken as a required non-empty
// string, but @libsql/client never sends it for a `file:` URL. Without this the
// config's own local fallback could not be migrated at all.
const LOCAL_TOKEN_PLACEHOLDER = 'local';

const isFileUrl = (url) => url.startsWith('file:');

/** Strips any query string, so a token embedded in a URL is never logged. */
export function describeUrl(url) {
	return url.replace(/\?.*$/, '');
}

function requireEnv(urlVar, tokenVar, stage) {
	const url = process.env[urlVar];
	if (!url) {
		throw new Error(
			`${urlVar} is not set, so there is no ${stage} database to talk to.\n` +
				`Add ${urlVar} and ${tokenVar} to .env — see .env.example.`
		);
	}
	return { url, authToken: process.env[tokenVar] };
}

/**
 * @param {string} name one of TARGETS
 * @returns {{ name: string, url: string, authToken: string | undefined }}
 */
export function resolveTarget(name) {
	if (!TARGETS.includes(name)) {
		throw new Error(`Unknown target "${name}". Use one of: ${TARGETS.join(', ')}.`);
	}

	if (name === 'local') {
		return { name, url: LOCAL_URL, authToken: LOCAL_TOKEN_PLACEHOLDER };
	}

	if (name === 'staging') {
		const { url, authToken } = requireEnv(
			'TURSO_STAGING_DATABASE_URL',
			'TURSO_STAGING_AUTH_TOKEN',
			'staging'
		);
		assertNotProduction(url);
		return { name, url, authToken };
	}

	const { url, authToken } = requireEnv(
		'TURSO_PRODUCTION_DATABASE_URL',
		'TURSO_PRODUCTION_AUTH_TOKEN',
		'production'
	);

	// A `file:` URL here means the variable was filled in with the local
	// placeholder — running a "production" migration against local.db would
	// report success and change nothing that matters.
	if (isFileUrl(url)) {
		throw new Error(
			`TURSO_PRODUCTION_DATABASE_URL points at ${describeUrl(url)}, which is a local file.\n` +
				'Set it to the production libsql:// URL, or use --target=local.'
		);
	}

	// Catches the copy-paste that matters: the staging URL pasted into the
	// production variable, or a production run aimed at staging by mistake.
	if (/staging/i.test(url)) {
		throw new Error(
			`TURSO_PRODUCTION_DATABASE_URL looks like a staging database:\n  ${describeUrl(url)}\n` +
				'Refusing — check which URL is in which variable.'
		);
	}

	return { name, url, authToken };
}

/** The reverse copy-paste: production's URL sitting in the staging variable. */
function assertNotProduction(stagingUrl) {
	const productionUrl = process.env.TURSO_PRODUCTION_DATABASE_URL;
	if (productionUrl && stagingUrl === productionUrl) {
		throw new Error(
			`TURSO_STAGING_DATABASE_URL and TURSO_PRODUCTION_DATABASE_URL are the same database:\n` +
				`  ${describeUrl(stagingUrl)}\n` +
				'Refusing — a staging run would hit production.'
		);
	}
}

/**
 * Reads the target from DB_TARGET, for tools that take no arguments of their
 * own. Unset means local, which is what a bare `npm run db:migrate` should do.
 */
export function targetFromEnv() {
	return resolveTarget(process.env.DB_TARGET ?? 'local');
}
