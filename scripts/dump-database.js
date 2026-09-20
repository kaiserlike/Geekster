#!/usr/bin/env node

/**
 * Writes a timestamped JSON snapshot of a database to `backups/`.
 *
 * Run this before anything destructive. Turso's free plan keeps one day of
 * point-in-time restore, which is the real safety net — but one day is short,
 * and a dump costs two seconds.
 *
 * Every table is dumped, `__drizzle_migrations` included, so a restored copy
 * can be told which migrations it has already had.
 *
 * Usage:
 *   npm run db:dump -- --target=local
 *   npm run db:dump -- --target=staging
 *   npm run db:dump -- --target=production
 *   npm run db:dump -- --target=production --out=/tmp/somewhere
 *
 * Restoring is deliberately manual — see .claude/docs/schema-migrations.md.
 */

import { resolveTarget, describeUrl, TARGETS } from './db-target.js';
import { createClient } from '@libsql/client';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = join(__dirname, '..', 'backups');

// Dumped in an order that could be replayed as-is: a row in `screenshots`
// references one in `games`.
const TABLES = ['games', 'screenshots', 'scores', '__drizzle_migrations'];

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

const outDir = flag('out') ? resolve(flag('out')) : DEFAULT_OUT;

const client = createClient({ url, authToken });

// A table that does not exist is reported rather than fatal — a fresh database
// has no `__drizzle_migrations` until something has been migrated or stamped.
const present = new Set(
	(
		await client.execute({
			sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${TABLES.map(() => '?').join(', ')})`,
			args: TABLES
		})
	).rows.map((row) => row.name)
);

const tables = {};
const counts = {};

for (const table of TABLES) {
	if (!present.has(table)) {
		counts[table] = null;
		continue;
	}
	const { rows } = await client.execute(`SELECT * FROM ${table}`);
	// libsql rows are array-like; spread into plain objects so the JSON is
	// readable and can be fed back in as named parameters.
	tables[table] = rows.map((row) => ({ ...row }));
	counts[table] = rows.length;
}

const takenAt = new Date().toISOString();
const dump = {
	meta: {
		target,
		url: describeUrl(url),
		takenAt,
		counts
	},
	tables
};

mkdirSync(outDir, { recursive: true });
const filename = `${target}-${takenAt.replace(/[:.]/g, '-')}.json`;
const path = join(outDir, filename);
writeFileSync(path, JSON.stringify(dump, null, 2) + '\n');

console.log(`Dumped ${target} (${describeUrl(url)})`);
for (const table of TABLES) {
	const n = counts[table];
	console.log(`  ${table.padEnd(22)} ${n === null ? '— not present' : n}`);
}
console.log(`\n${path}`);
