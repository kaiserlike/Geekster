#!/usr/bin/env node
// Uploads the local screenshots in static/screenshots/ to Vercel Blob and
// rewrites the screenshots.url column in the database to the returned blob URLs.
//
// Requires BLOB_READ_WRITE_TOKEN (Vercel dashboard → Storage → Blob store → tokens)
// plus the usual TURSO_DATABASE_URL / TURSO_AUTH_TOKEN.
//
// Usage:
//   npm run blob:migrate -- --dry-run   Show what would be uploaded, change nothing
//   npm run blob:migrate                Upload rows that still have a local path
//   npm run blob:migrate -- --force     Re-upload every row, even ones already on Blob

import './load-env.js';
import { createClient } from '@libsql/client';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, '..', 'static', 'screenshots');
const BLOB_PREFIX = 'screenshots';
const CONCURRENCY = 8;
const CACHE_MAX_AGE = 60 * 60 * 24 * 365; // screenshots are immutable per pathname

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!blobToken && !dryRun) {
	console.error('Missing BLOB_READ_WRITE_TOKEN. Add it to .env (or run with --dry-run).');
	process.exit(1);
}

const client = createClient({
	url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
	authToken: process.env.TURSO_AUTH_TOKEN
});

const isAbsolute = (url) => /^https?:\/\//.test(url);

const { rows } = await client.execute(
	'SELECT s.id, s.url, g.name FROM screenshots s JOIN games g ON g.id = s.game_id ORDER BY s.id'
);

const pending = rows.filter((row) => force || !isAbsolute(row.url));
const alreadyMigrated = rows.length - pending.length;

console.log(
	`${rows.length} screenshot rows, ${pending.length} to upload` +
		(alreadyMigrated ? `, ${alreadyMigrated} already on Blob` : '')
);

if (dryRun) {
	for (const row of pending.slice(0, 5)) {
		console.log(`  would upload ${basename(row.url)} → ${BLOB_PREFIX}/${basename(row.url)}`);
	}
	if (pending.length > 5) console.log(`  ... and ${pending.length - 5} more`);
	process.exit(0);
}

if (pending.length === 0) {
	console.log('Nothing to do.');
	process.exit(0);
}

const failures = [];
let uploaded = 0;

async function migrateRow(row) {
	const filename = basename(row.url);
	try {
		const file = await readFile(join(SCREENSHOT_DIR, filename));
		const blob = await put(`${BLOB_PREFIX}/${filename}`, file, {
			access: 'public',
			token: blobToken,
			addRandomSuffix: false,
			allowOverwrite: true,
			contentType: 'image/webp',
			cacheControlMaxAge: CACHE_MAX_AGE
		});
		await client.execute({
			sql: 'UPDATE screenshots SET url = ? WHERE id = ?',
			args: [blob.url, row.id]
		});
		uploaded++;
		console.log(`  [${uploaded}/${pending.length}] ${row.name} → ${blob.url}`);
	} catch (error) {
		failures.push({ name: row.name, filename, message: error.message });
	}
}

// Simple worker pool — Blob rate-limits aggressive parallel uploads.
const queue = [...pending];
await Promise.all(
	Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
		let row;
		while ((row = queue.shift())) await migrateRow(row);
	})
);

console.log(`\nUploaded ${uploaded} screenshot(s).`);

if (failures.length > 0) {
	console.error(`\n${failures.length} failed:`);
	for (const failure of failures) {
		console.error(`  ${failure.name} (${failure.filename}): ${failure.message}`);
	}
	process.exit(1);
}

process.exit(0);
