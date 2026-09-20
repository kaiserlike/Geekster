#!/usr/bin/env node

/**
 * Seeds the database from `src/lib/data/games.json`.
 *
 * The database is the single source of truth — this script only ever adds to it
 * or corrects a name/year. It never deletes, never reassigns IDs and never
 * overwrites a screenshot URL that already points at Vercel Blob.
 *
 * The tables must already exist — `npm run db:migrate` owns the schema.
 *
 * Usage:
 *   npm run db:seed                # only runs against an empty games table
 *   npm run db:seed -- --force     # allow seeding into a database that has games
 *   npm run db:seed -- --dry-run   # report what would change, write nothing
 */

import './load-env.js';
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

const ABSOLUTE_URL = /^https?:\/\//;

const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

const gamesPath = join(__dirname, '..', 'src', 'lib', 'data', 'games.json');
const gamesData = JSON.parse(readFileSync(gamesPath, 'utf-8'));

// Derive the slug from the screenshot path: /screenshots/super-mario-bros.webp -> super-mario-bros
function slugOf(game) {
	return game.screenshot.replace('/screenshots/', '').replace('.webp', '');
}

// The schema belongs to drizzle/ since Sprint 7h. This script used to create the
// tables itself, which is half of how the databases drifted in the first place:
// tables made here never got a row in `__drizzle_migrations`, so the next
// `db:migrate` would try to CREATE TABLE on top of them and fail.
const REQUIRED_TABLES = ['games', 'screenshots', 'scores'];
const tableCheck = await client.execute({
	sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${REQUIRED_TABLES.map(() => '?').join(', ')})`,
	args: REQUIRED_TABLES
});
const missingTables = REQUIRED_TABLES.filter(
	(name) => !tableCheck.rows.some((row) => row.name === name)
);

if (missingTables.length) {
	console.error(
		`Missing ${missingTables.join(', ')} in ${url}.\n` +
			'Run `npm run db:migrate` first — the schema comes from drizzle/, not from this script.'
	);
	process.exit(1);
}

const existing = await client.execute('SELECT COUNT(*) AS count FROM games');
const existingCount = Number(existing.rows[0].count);

if (existingCount > 0 && !FORCE && !DRY_RUN) {
	console.error(`Refusing to seed: the games table already holds ${existingCount} rows.`);
	console.error('This database may contain games created in the admin panel.');
	console.error('Re-run with --force once you are sure, or with --dry-run to see the plan.');
	process.exit(1);
}

console.log(`${DRY_RUN ? '[dry run] ' : ''}Seeding ${gamesData.length} games into ${url}`);

let inserted = 0;
let updated = 0;
let screenshotsInserted = 0;
let screenshotsOnBlob = 0;
let screenshotsLocal = 0;
let unchanged = 0;

for (const game of gamesData) {
	const slug = slugOf(game);

	const found = await client.execute({
		sql: 'SELECT id, name, year FROM games WHERE slug = ?',
		args: [slug]
	});

	let gameId;

	if (found.rows.length === 0) {
		if (DRY_RUN) {
			console.log(`  + insert ${slug} (${game.name}, ${game.year}) with ${game.screenshot}`);
			inserted++;
			screenshotsInserted++;
			continue;
		}
		const result = await client.execute({
			sql: 'INSERT INTO games (name, slug, year) VALUES (?, ?, ?)',
			args: [game.name, slug, game.year]
		});
		gameId = Number(result.lastInsertRowid);
		inserted++;
	} else {
		const row = found.rows[0];
		gameId = Number(row.id);

		if (row.name !== game.name || Number(row.year) !== game.year) {
			if (DRY_RUN) {
				console.log(
					`  ~ update ${slug}: "${row.name}" (${row.year}) -> "${game.name}" (${game.year})`
				);
			} else {
				await client.execute({
					sql: 'UPDATE games SET name = ?, year = ? WHERE id = ?',
					args: [game.name, game.year, gameId]
				});
			}
			updated++;
		} else {
			unchanged++;
		}
	}

	// A game keeps the screenshot it already has — in particular the absolute
	// Vercel Blob URL written by `npm run blob:migrate`.
	const shots = await client.execute({
		sql: 'SELECT id, url FROM screenshots WHERE game_id = ? AND is_primary = 1',
		args: [gameId]
	});

	if (shots.rows.length === 0) {
		if (DRY_RUN) {
			console.log(`  + screenshot for ${slug}: ${game.screenshot}`);
		} else {
			await client.execute({
				sql: 'INSERT INTO screenshots (game_id, url, difficulty, is_primary) VALUES (?, ?, ?, ?)',
				args: [gameId, game.screenshot, 'medium', 1]
			});
		}
		screenshotsInserted++;
	} else if (ABSOLUTE_URL.test(String(shots.rows[0].url))) {
		screenshotsOnBlob++;
	} else {
		screenshotsLocal++;
	}
}

console.log(
	`${DRY_RUN ? '[dry run] ' : ''}Games: ${inserted} inserted, ${updated} updated, ${unchanged} unchanged.`
);
console.log(
	`${DRY_RUN ? '[dry run] ' : ''}Screenshots: ${screenshotsInserted} inserted, ` +
		`${screenshotsOnBlob} already on blob, ${screenshotsLocal} still local — all kept as-is.`
);

if (screenshotsInserted > 0 && !DRY_RUN) {
	console.log('New screenshots point at local paths — run `npm run blob:migrate` to upload them.');
}

process.exit(0);
