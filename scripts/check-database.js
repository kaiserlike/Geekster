#!/usr/bin/env node

/**
 * Checks that a database is sound and fully migrated. Reads only; writes nothing.
 *
 *   1. `PRAGMA integrity_check` answers `ok`
 *   2. `PRAGMA foreign_key_check` finds no dangling reference. The migrator
 *      switches foreign keys off while it runs, so a rebuild that breaks one
 *      commits without complaint — this is the only thing that notices
 *   3. Every migration in `drizzle/meta/_journal.json` is recorded in
 *      `__drizzle_migrations` with the hash of its `.sql` file — nothing is
 *      pending, and no file was edited after it was applied
 *
 * Exits 1 when any check fails, so the migration workflow fails with it. Run
 * after every `db:migrate:*`, by hand or in CI.
 *
 * Usage:
 *   npm run db:check -- --target=local
 *   npm run db:check -- --target=staging
 *   npm run db:check -- --target=production
 */

import { resolveTarget, describeUrl, TARGETS } from './db-target.js';
import { createClient } from '@libsql/client';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'drizzle');
const MIGRATIONS_TABLE = '__drizzle_migrations';

const args = process.argv.slice(2);
const flag = (name) =>
	args
		.find((a) => a.startsWith(`--${name}=`))
		?.split('=')
		.slice(1)
		.join('=');

const target = flag('target');
if (!target) {
	console.error(`Missing --target=${TARGETS.join('|')}`);
	process.exit(1);
}

let url, authToken;
try {
	({ url, authToken } = resolveTarget(target));
} catch (error) {
	console.error(error.message);
	process.exit(1);
}

console.log(`Target  ${target} (${describeUrl(url)})`);

const client = createClient({ url, authToken });
const failures = [];

const integrity = await client.execute('PRAGMA integrity_check');
const integrityMessages = integrity.rows.map((row) => String(Object.values(row)[0]));
if (integrityMessages.length === 1 && integrityMessages[0] === 'ok') {
	console.log('ok      integrity_check');
} else {
	failures.push(`integrity_check:\n  ${integrityMessages.join('\n  ')}`);
}

const dangling = await client.execute('PRAGMA foreign_key_check');
if (dangling.rows.length === 0) {
	console.log('ok      foreign_key_check');
} else {
	const lines = dangling.rows.map(
		(row) => `${row.table} rowid ${row.rowid} → ${row.parent} (constraint ${row.fkid})`
	);
	failures.push(`foreign_key_check, ${lines.length} dangling:\n  ${lines.join('\n  ')}`);
}

// Hashed exactly as drizzle-orm's readMigrationFiles() hashes them, so a match
// means this very file is what was applied.
const journal = JSON.parse(readFileSync(join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf-8'));
const expected = journal.entries.map((entry) => ({
	tag: entry.tag,
	hash: createHash('sha256')
		.update(readFileSync(join(MIGRATIONS_DIR, `${entry.tag}.sql`), 'utf-8'))
		.digest('hex')
}));

const bookkeeping = await client.execute({
	sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
	args: [MIGRATIONS_TABLE]
});
const applied = new Set();
if (bookkeeping.rows.length) {
	const rows = await client.execute(`SELECT hash FROM ${MIGRATIONS_TABLE}`);
	for (const row of rows.rows) applied.add(String(row.hash));
}

const missing = expected.filter((migration) => !applied.has(migration.hash));
if (missing.length === 0) {
	console.log(
		`ok      migrations — all ${expected.length} recorded, the last ${expected.at(-1).tag}`
	);
} else {
	failures.push(
		`migrations not recorded (pending, or the .sql changed after it was applied):\n  ` +
			missing.map((migration) => migration.tag).join('\n  ')
	);
}

if (failures.length) {
	for (const failure of failures) console.error(`FAILED  ${failure}`);
	process.exit(1);
}
