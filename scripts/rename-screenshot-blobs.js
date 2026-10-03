#!/usr/bin/env node

/**
 * Gives every screenshot blob a random name: `screenshots/<slug>….webp` becomes
 * `screenshots/<32 hex>.webp`, `screenshots.url` is rewritten, and the old file
 * is deleted. Sprint 10a, a one-off.
 *
 * Why: the image URL is the one thing a player sees before placing a card, and
 * a slug in it named the game in the network panel. `uploadScreenshot()` in
 * src/lib/server/blob.ts writes random names since 10a; this script renames
 * what was uploaded before.
 *
 * Per row: `copy()` to the new name, then `UPDATE … WHERE id = ? AND url = ?`
 * (so a row the admin panel changed meanwhile is left alone), then `del()` of
 * the old file. A failure leaves that row on its old, still existing file.
 *
 * A stage renames only the blobs it owns — the same rule as `ownsBlob()`:
 * production renames pathnames without `staging/`, staging only those with it.
 * Staging holds production's URLs verbatim, so once production has run, its old
 * files are gone and staging needs `npm run db:refresh-staging` right after.
 *
 * Cost: one `copy()` per row, and `copy()` is a Blob *advanced operation*
 * (Hobby: 2,000 a month included; going over locks the store for 30 days —
 * check the month's usage in the dashboard first). `del()` is free.
 *
 * Usage:
 *   node scripts/rename-screenshot-blobs.js --target=production --dry-run
 *   node scripts/rename-screenshot-blobs.js --target=production --limit=3
 *   node scripts/rename-screenshot-blobs.js --target=production
 *   (--no-backup skips the automatic db:dump)
 */

import { resolveTarget, describeUrl } from './db-target.js';
import { createClient } from '@libsql/client';
import { copy, del } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BLOB_HOST = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i;
const STAGING_PREFIX = 'staging/';
/** What `uploadScreenshot()` writes since 10a: nothing to rename. */
const RANDOM_NAME = /^(staging\/)?screenshots\/[0-9a-f]{32}\.[a-z0-9]+$/;
const CONCURRENCY = 4; // Hobby allows 15 advanced operations a second
const CACHE_MAX_AGE = 60 * 60 * 24 * 365; // as every upload

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const noBackup = args.includes('--no-backup');
const targetName = args.find((a) => a.startsWith('--target='))?.split('=')[1];
const limitArg = args.find((a) => a.startsWith('--limit='))?.split('=')[1];
const limit = limitArg === undefined ? Infinity : Number(limitArg);

if (targetName !== 'staging' && targetName !== 'production') {
	console.error('Pass --target=staging or --target=production.');
	process.exit(1);
}
if (!(limit > 0)) {
	console.error('--limit must be a positive number.');
	process.exit(1);
}

let target;
try {
	target = resolveTarget(targetName);
} catch (error) {
	console.error(error.message);
	process.exit(1);
}

const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token && !dryRun) {
	console.error('Missing BLOB_READ_WRITE_TOKEN in .env.');
	process.exit(1);
}

function pathnameOf(url) {
	return new URL(url).pathname.replace(/^\//, '');
}

function ownedByTarget(pathname) {
	return pathname.startsWith(STAGING_PREFIX) === (targetName === 'staging');
}

function newPathname(oldPathname) {
	const ext = oldPathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? 'webp';
	const prefix = targetName === 'staging' ? STAGING_PREFIX : '';
	return `${prefix}screenshots/${randomUUID().replaceAll('-', '')}.${ext}`;
}

console.log(`Target  ${targetName}  ${describeUrl(target.url)}\n`);
const client = createClient({ url: target.url, authToken: target.authToken });

const { rows } = await client.execute('SELECT id, url FROM screenshots ORDER BY id');
const local = rows.filter((r) => !BLOB_HOST.test(r.url));
const blobRows = rows.filter((r) => BLOB_HOST.test(r.url));
const done = blobRows.filter((r) => RANDOM_NAME.test(pathnameOf(r.url)));
const foreign = blobRows.filter(
	(r) => !RANDOM_NAME.test(pathnameOf(r.url)) && !ownedByTarget(pathnameOf(r.url))
);
const pending = blobRows
	.filter((r) => !RANDOM_NAME.test(pathnameOf(r.url)) && ownedByTarget(pathnameOf(r.url)))
	.slice(0, limit);

console.log(`${rows.length} screenshot rows`);
console.log(`  ${pending.length} to rename${limit < Infinity ? ` (--limit=${limit})` : ''}`);
console.log(`  ${done.length} already random`);
console.log(`  ${foreign.length} owned by the other stage — left alone`);
console.log(`  ${local.length} local paths (seed data) — left alone`);
console.log(
	`\nThis costs ${pending.length} copy() calls = ${pending.length} advanced operations.\n`
);

if (dryRun) {
	for (const row of pending.slice(0, 5)) {
		console.log(`  #${row.id}  ${pathnameOf(row.url)} → ${newPathname(pathnameOf(row.url))}`);
	}
	if (pending.length > 5) console.log(`  … and ${pending.length - 5} more`);
	console.log('\n--dry-run: nothing written.');
	process.exit(0);
}

if (pending.length === 0) {
	console.log('Nothing to do.');
	process.exit(0);
}

if (!noBackup) {
	console.log(`Backing ${targetName} up first…`);
	const dump = spawnSync(
		process.execPath,
		[join(__dirname, 'dump-database.js'), `--target=${targetName}`],
		{ stdio: 'inherit' }
	);
	if (dump.status !== 0) {
		console.error('\nThe backup failed, so nothing was renamed.');
		process.exit(1);
	}
	console.log('');
}

const failures = [];
const orphans = [];
let renamed = 0;

async function renameRow(row) {
	const from = pathnameOf(row.url);
	let copied;
	try {
		copied = await copy(row.url, newPathname(from), {
			access: 'public',
			addRandomSuffix: false,
			allowOverwrite: false,
			cacheControlMaxAge: CACHE_MAX_AGE,
			token
		});
	} catch (error) {
		failures.push({ id: row.id, from, message: `copy: ${error.message}` });
		return;
	}

	const result = await client.execute({
		sql: 'UPDATE screenshots SET url = ? WHERE id = ? AND url = ?',
		args: [copied.url, row.id, row.url]
	});
	if (result.rowsAffected !== 1) {
		// The row changed under us; the copy is unused, the old file still in use.
		failures.push({ id: row.id, from, message: 'row changed meanwhile, not rewritten' });
		await del(copied.url, { token }).catch(() => orphans.push(copied.url));
		return;
	}

	renamed++;
	console.log(`  [${renamed}/${pending.length}] #${row.id}  ${from} → ${pathnameOf(copied.url)}`);

	try {
		await del(row.url, { token });
	} catch {
		orphans.push(row.url);
	}
}

const queue = [...pending];
await Promise.all(
	Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
		let row;
		while ((row = queue.shift())) await renameRow(row);
	})
);

console.log(`\nRenamed ${renamed} of ${pending.length}.`);
if (orphans.length) {
	console.log(`${orphans.length} old file(s) could not be deleted (harmless, unreferenced):`);
	for (const url of orphans) console.log(`  ${url}`);
}
if (targetName === 'production' && renamed > 0) {
	console.log('\nStaging still points at the deleted files: run `npm run db:refresh-staging` now.');
}
if (failures.length) {
	console.error(`\n${failures.length} failed (still on their old file):`);
	for (const f of failures) console.error(`  #${f.id}  ${f.from}: ${f.message}`);
	process.exit(1);
}
