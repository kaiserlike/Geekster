#!/usr/bin/env node

/**
 * Copies production's games and screenshots into staging. One way only.
 *
 * There is deliberately no staging → production direction; SPRINTS.md § Sprint 7h
 * has the reasoning (ID collisions, a merge needs a human, images would gain a
 * second source of truth).
 *
 * `screenshots.url` is copied **verbatim**, production blob URLs included, and
 * no image is copied. The store is public, so staging can serve production's
 * images, and the cross-stage delete guard in src/lib/server/blob.ts means
 * staging cannot delete them: `ownsBlob()` refuses any pathname belonging to
 * another stage. That guard is what makes a verbatim copy safe.
 *
 * `scores` is left alone — those are staging's own, and losing them to a refresh
 * would be a surprise rather than a feature.
 *
 * Usage:
 *   npm run db:refresh-staging -- --dry-run   Print the plan, write nothing
 *   npm run db:refresh-staging                Take a backup, then replace
 *   npm run db:refresh-staging -- --no-backup Skip the automatic dump
 */

import { resolveTarget, describeUrl } from './db-target.js';
import { createClient } from '@libsql/client';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const TABLES = ['games', 'screenshots'];

/** Column names a table actually has, so the copy survives a schema difference. */
async function columnsOf(client, table) {
	const { rows } = await client.execute(`PRAGMA table_info(${table})`);
	return rows.map((row) => row.name);
}

/**
 * What a refresh would do: per table, the columns it can copy, the ones only the
 * target has, and the row counts either side. Reads only.
 */
export async function planRefresh(source, target) {
	const plan = {};
	for (const table of TABLES) {
		const [from, to] = await Promise.all([columnsOf(source, table), columnsOf(target, table)]);
		const [{ rows: sourceCount }, { rows: targetCount }] = await Promise.all([
			source.execute(`SELECT COUNT(*) AS n FROM ${table}`),
			target.execute(`SELECT COUNT(*) AS n FROM ${table}`)
		]);

		plan[table] = {
			// Staging is migrated before production by design, so it can have a
			// column production does not yet — `games.published` between 7i-a
			// shipping and the release. Copy the intersection and let the target's
			// own defaults fill the rest.
			columns: from.filter((column) => to.includes(column)),
			skipped: to.filter((column) => !from.includes(column)),
			from: Number(sourceCount[0].n),
			to: Number(targetCount[0].n)
		};
	}
	return plan;
}

/**
 * Replaces the target's games and screenshots with the source's. `scores` is
 * left alone — those are the target's own, and losing them to a refresh would be
 * a surprise rather than a feature.
 *
 * IDs are copied as they are: staging should look exactly like production, and
 * an /admin/games/<id> link should mean the same thing in both.
 */
export async function copyRows(source, target, plan) {
	// Screenshots reference games, so they go first out and last in.
	await target.execute('DELETE FROM screenshots');
	await target.execute('DELETE FROM games');

	const copied = {};
	for (const table of TABLES) {
		const { columns } = plan[table];
		const { rows } = await source.execute(`SELECT ${columns.join(', ')} FROM ${table} ORDER BY id`);

		const statements = rows.map((row) => ({
			sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
			args: columns.map((column) => row[column])
		}));

		if (statements.length) await target.batch(statements, 'write');
		copied[table] = statements.length;
	}
	return copied;
}

// Everything below runs only when this file is the entry point.
if (process.argv[1] !== fileURLToPath(import.meta.url)) {
	// Imported for its functions (see scripts/__tests__), not to be run.
} else {
	await main();
}

async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const noBackup = args.includes('--no-backup');

	let source, target;
	try {
		source = resolveTarget('production');
		target = resolveTarget('staging');
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}

	// resolveTarget() already refuses a staging URL identical to production's, but
	// this script is the one that would empty a database, so it checks again
	// rather than trusting a caller to have gone through the same path.
	if (source.url === target.url) {
		console.error('Production and staging resolve to the same database. Refusing.');
		process.exit(1);
	}

	console.log(`From  production  ${describeUrl(source.url)}`);
	console.log(`To    staging     ${describeUrl(target.url)}\n`);

	const production = createClient({ url: source.url, authToken: source.authToken });
	const staging = createClient({ url: target.url, authToken: target.authToken });

	const plan = await planRefresh(production, staging);

	for (const table of TABLES) {
		console.log(
			`${table.padEnd(12)} ${plan[table].to} in staging → ${plan[table].from} from production`
		);
		if (plan[table].skipped.length) {
			console.log(
				`${''.padEnd(12)} not in production, left at staging's default: ${plan[table].skipped.join(', ')}`
			);
		}
	}

	const { rows: scoreRows } = await staging.execute('SELECT COUNT(*) AS n FROM scores');
	console.log(`scores       ${Number(scoreRows[0].n)} in staging — left alone\n`);

	if (dryRun) {
		console.log('--dry-run: nothing written.');
		return;
	}

	if (!noBackup) {
		console.log('Backing staging up first…');
		const dump = spawnSync(
			process.execPath,
			[join(__dirname, 'dump-database.js'), '--target=staging'],
			{ stdio: 'inherit' }
		);
		if (dump.status !== 0) {
			console.error('\nThe backup failed, so nothing was replaced.');
			process.exit(1);
		}
		console.log('');
	}

	const copied = await copyRows(production, staging, plan);
	for (const table of TABLES) console.log(`${table.padEnd(12)} ${copied[table]} copied`);

	const [g, s] = await Promise.all([
		staging.execute('SELECT COUNT(*) AS n FROM games'),
		staging.execute('SELECT COUNT(*) AS n FROM screenshots')
	]);
	console.log(
		`\nStaging now holds ${Number(g.rows[0].n)} games and ${Number(s.rows[0].n)} screenshots.`
	);
	console.log("No image was touched — the URLs point at production's blobs.");
}
