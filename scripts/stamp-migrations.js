#!/usr/bin/env node

/**
 * Marks a database as already migrated, without running the migration's SQL.
 *
 * Needed exactly once, for the baseline. The three databases were created by
 * raw `CREATE TABLE IF NOT EXISTS` statements in seed-database.js plus a manual
 * `drizzle-kit push`, so their tables already exist while drizzle's own
 * `__drizzle_migrations` bookkeeping table does not. `drizzle-kit migrate`
 * would try to run `0000_baseline.sql`, whose first statement is a plain
 * `CREATE TABLE games`, and fail. Stamping writes the bookkeeping row that a
 * successful run would have written, so the next `db:migrate` is a no-op and
 * every migration after the baseline applies normally.
 *
 * The row it writes is the one `drizzle-orm/libsql/migrator` writes itself:
 * the sha256 of the .sql file, and the journal's `when` as created_at. The
 * migrator skips any migration whose `when` is not newer than the newest
 * created_at in the table, which is what makes the stamped baseline a no-op.
 *
 * This only ever stamps the baseline (journal entry 0). Stamping a later
 * migration would silently skip real DDL; pass --tag to do it deliberately.
 *
 * Usage:
 *   node scripts/stamp-migrations.js --target=local --dry-run
 *   node scripts/stamp-migrations.js --target=staging
 *   node scripts/stamp-migrations.js --target=production
 *   node scripts/stamp-migrations.js --target=production --tag=0001_whatever
 *
 * staging reads TURSO_STAGING_DATABASE_URL / TURSO_STAGING_AUTH_TOKEN,
 * production reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN — both sit commented
 * out in .env and are uncommented deliberately for a one-off like this.
 */

import './load-env.js';
import { createClient } from '@libsql/client';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'drizzle');
const MIGRATIONS_TABLE = '__drizzle_migrations';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const flag = (name) =>
	args
		.find((a) => a.startsWith(`--${name}=`))
		?.split('=')
		.slice(1)
		.join('=');

const target = flag('target');
const tag = flag('tag');

if (!target) {
	console.error('Missing --target=local|staging|production');
	process.exit(1);
}

// Resolve the target database. Each stage is named explicitly so that stamping
// production is never something that happens because of a stale shell variable.
function resolveTarget(name) {
	if (name === 'local') {
		return { url: 'file:local.db', authToken: undefined };
	}
	if (name === 'staging') {
		const url = process.env.TURSO_STAGING_DATABASE_URL;
		if (!url) {
			console.error(
				'TURSO_STAGING_DATABASE_URL is not set. Uncomment the staging credentials in .env.'
			);
			process.exit(1);
		}
		return { url, authToken: process.env.TURSO_STAGING_AUTH_TOKEN };
	}
	if (name === 'production') {
		const url = process.env.TURSO_DATABASE_URL;
		if (!url || url.startsWith('file:')) {
			console.error(
				`TURSO_DATABASE_URL points at ${url ?? 'nothing'}, not at the production database.\n` +
					'Uncomment the live credentials in .env for this operation, then comment them out again.'
			);
			process.exit(1);
		}
		return { url, authToken: process.env.TURSO_AUTH_TOKEN };
	}
	console.error(`Unknown target "${name}". Use local, staging or production.`);
	process.exit(1);
}

const { url, authToken } = resolveTarget(target);

// Read the journal the same way drizzle-orm's readMigrationFiles() does, so the
// hash written here is byte-for-byte the one a real migration run would write.
const journal = JSON.parse(readFileSync(join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf-8'));

const entry = tag ? journal.entries.find((e) => e.tag === tag) : journal.entries[0];
if (!entry) {
	console.error(`No journal entry${tag ? ` tagged ${tag}` : ''} in drizzle/meta/_journal.json`);
	process.exit(1);
}

const sql = readFileSync(join(MIGRATIONS_DIR, `${entry.tag}.sql`), 'utf-8');
const hash = createHash('sha256').update(sql).digest('hex');

// Every table the migration would have created. If one is missing the database
// was never set up, and it wants a real migrate rather than a stamp.
const tables = [...sql.matchAll(/CREATE TABLE `([^`]+)`/g)].map((m) => m[1]);

console.log(`Target      ${target} (${url.replace(/\?.*$/, '')})`);
console.log(`Migration   ${entry.tag}`);
console.log(`Hash        ${hash}`);
console.log(`created_at  ${entry.when}`);

const client = createClient({ url, authToken });

const existing = await client.execute({
	sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${tables.map(() => '?').join(', ')})`,
	args: tables
});
const present = new Set(existing.rows.map((row) => row.name));
const missing = tables.filter((name) => !present.has(name));

if (missing.length) {
	console.error(
		`\nRefusing to stamp: ${missing.join(', ')} ${missing.length === 1 ? 'does' : 'do'} not exist in this database.\n` +
			'Stamping claims the migration already ran. Run `npm run db:migrate` against it instead.'
	);
	process.exit(1);
}
console.log(`Tables      ${tables.join(', ')} — all present`);

// Read before writing, so that --dry-run really writes nothing — creating the
// bookkeeping table is itself a write, and a dry run against production should
// leave no trace at all.
const bookkeeping = await client.execute({
	sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
	args: [MIGRATIONS_TABLE]
});

if (bookkeeping.rows.length) {
	const already = await client.execute({
		sql: `SELECT hash FROM ${MIGRATIONS_TABLE} WHERE hash = ?`,
		args: [hash]
	});
	if (already.rows.length) {
		console.log(`\nAlready stamped — nothing to do.`);
		process.exit(0);
	}
}

if (dryRun) {
	console.log(
		`\n--dry-run: would insert 1 row into ${MIGRATIONS_TABLE}` +
			(bookkeeping.rows.length ? '' : ` (and create the table)`) +
			'. Nothing written.'
	);
	process.exit(0);
}

await client.execute(`
	CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
		id SERIAL PRIMARY KEY,
		hash text NOT NULL,
		created_at numeric
	)
`);

await client.execute({
	sql: `INSERT INTO ${MIGRATIONS_TABLE} ("hash", "created_at") VALUES (?, ?)`,
	args: [hash, entry.when]
});

console.log(`\nStamped. Verify with: npm run db:migrate  (must report nothing to apply)`);
