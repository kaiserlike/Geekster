#!/usr/bin/env node

/**
 * Fills in the encyclopedia's covers (12c) from RAWG's key art, for the games that have none.
 *
 * A cover is taken only for an unambiguous match: exactly one RAWG result with the game's name
 * (compared without case, accents or punctuation) and its year. Everything else is listed for
 * the admin panel's Cover section. Never a screenshot (decision 12-2): the key art is skipped
 * when one of the game's screenshots was cut from it.
 *
 * Each image is cropped to 16:9 around its centre and encoded as WebP at most 1600×900 (never
 * scaled up), as the browser does for every admin upload, and stored like a screenshot:
 * `screenshots/<32 hex>.webp`, under `staging/` outside production. A row is written only while
 * its cover is still empty, so a cover set in the admin meanwhile is kept.
 *
 * Staging is not a target: it gets production's covers from `db:refresh-staging`.
 *
 * Needs RAWG_API_KEY and, unless --dry-run, BLOB_READ_WRITE_TOKEN in .env.
 *
 * Usage:
 *   npm run covers:fill -- --target=production --dry-run   Match and report, write nothing
 *   npm run covers:fill -- --target=production             Upload and write the matches
 *   npm run covers:fill -- --target=local --limit=5        Try a few against local.db
 */

import { resolveTarget, describeUrl } from './db-target.js';
import { createClient } from '@libsql/client';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const RAWG_SEARCH = 'https://api.rawg.io/api/games';
const RAWG_MEDIA_HOST = /^https:\/\/([a-z0-9-]+\.)*rawg\.io\//i;
const RAWG_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEARCH_RESULTS = 10;
// The admin's encoding (src/lib/imageEncode.ts, src/lib/crop.ts)
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 900;
const WEBP_QUALITY = 85;
const TARGETS = ['local', 'production'];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const targetArg = args.find((arg) => arg.startsWith('--target='))?.split('=')[1];
const limitArg = args.find((arg) => arg.startsWith('--limit='))?.split('=')[1];
const limit = limitArg === undefined ? Infinity : Number(limitArg);

if (!TARGETS.includes(targetArg)) {
	console.error(
		`Missing or wrong --target=${TARGETS.join('|')}. Staging gets its covers from db:refresh-staging.`
	);
	process.exit(1);
}
if (!(limit > 0) || !Number.isInteger(limit === Infinity ? 1 : limit)) {
	console.error('--limit must be a positive whole number.');
	process.exit(1);
}

const rawgKey = process.env.RAWG_API_KEY?.trim();
const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!rawgKey) {
	console.error('Missing RAWG_API_KEY in .env.');
	process.exit(1);
}
if (!blobToken && !dryRun) {
	console.error('Missing BLOB_READ_WRITE_TOKEN in .env (or run with --dry-run).');
	process.exit(1);
}

const target = resolveTarget(targetArg);
const db = createClient({ url: target.url, authToken: target.authToken });
// The blob store's stage prefix, as src/lib/server/blob.ts names it
const blobPrefix = targetArg === 'production' ? '' : 'staging/';

/** `Tom Clancy's Splinter Cell` and `tom clancys splinter cell` are one name */
function normalise(name) {
	return name
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]/g, '');
}

async function searchRawg(name) {
	const url = new URL(RAWG_SEARCH);
	url.searchParams.set('key', rawgKey);
	url.searchParams.set('search', name);
	url.searchParams.set('search_precise', 'true');
	url.searchParams.set('page_size', String(SEARCH_RESULTS));
	const response = await fetch(url);
	if (!response.ok) throw new Error(`RAWG responded ${response.status}`);
	const body = await response.json();
	return body.results ?? [];
}

/** The one RAWG result for this game, or why there is none */
function matchOf(game, results) {
	const wanted = normalise(game.name);
	const matches = results.filter(
		(result) =>
			normalise(result.name) === wanted &&
			result.released &&
			Number(result.released.slice(0, 4)) === game.year
	);
	if (matches.length === 0) return { reason: 'no RAWG result with this name and year' };
	if (matches.length > 1) return { reason: `${matches.length} RAWG results match` };
	const [match] = matches;
	if (!match.background_image || !RAWG_MEDIA_HOST.test(match.background_image)) {
		return { reason: 'RAWG has no key art' };
	}
	if (game.sources.includes(match.background_image)) {
		return { reason: 'a screenshot was cut from the key art' };
	}
	return { match };
}

/** 16:9 around the centre, at most 1600×900, never scaled up */
async function encodeCover(imageUrl) {
	const response = await fetch(imageUrl);
	if (!response.ok) throw new Error(`could not download the key art (${response.status})`);
	const input = Buffer.from(await response.arrayBuffer());
	const { width, height } = await sharp(input).metadata();
	const cropWidth = Math.min(width, Math.round((height * 16) / 9));
	const cropHeight = Math.round((cropWidth * 9) / 16);
	const outWidth = Math.min(cropWidth, MAX_WIDTH);
	const outHeight = Math.min(cropHeight, MAX_HEIGHT, Math.round((outWidth * 9) / 16));
	return sharp(input)
		.extract({
			left: Math.floor((width - cropWidth) / 2),
			top: Math.floor((height - cropHeight) / 2),
			width: cropWidth,
			height: cropHeight
		})
		.resize(outWidth, outHeight)
		.webp({ quality: WEBP_QUALITY })
		.toBuffer();
}

async function uploadCover(data) {
	const pathname = `${blobPrefix}screenshots/${randomUUID().replaceAll('-', '')}.webp`;
	const result = await put(pathname, data, {
		access: 'public',
		addRandomSuffix: false,
		allowOverwrite: false,
		contentType: 'image/webp',
		cacheControlMaxAge: 31536000,
		token: blobToken
	});
	return result.url;
}

async function main() {
	console.log(
		`${dryRun ? 'Dry run against' : 'Filling covers on'} ${target.name} (${describeUrl(target.url)})`
	);

	const { rows: gameRows } = await db.execute(
		'SELECT id, name, year FROM games WHERE cover_url IS NULL ORDER BY year, name'
	);
	const { rows: shotRows } = await db.execute(
		'SELECT game_id, source_url FROM screenshots WHERE source_url IS NOT NULL'
	);
	const sourcesOf = new Map();
	for (const row of shotRows) {
		const id = Number(row.game_id);
		sourcesOf.set(id, [...(sourcesOf.get(id) ?? []), row.source_url]);
	}

	const todo = gameRows.slice(0, limit).map((row) => ({
		id: Number(row.id),
		name: String(row.name),
		year: Number(row.year),
		sources: sourcesOf.get(Number(row.id)) ?? []
	}));
	console.log(`${gameRows.length} games without a cover; looking at ${todo.length}.\n`);

	const filled = [];
	const skipped = [];
	for (const game of todo) {
		const label = `${game.name} (${game.year})`;
		try {
			const { match, reason } = matchOf(game, await searchRawg(game.name));
			if (!match) {
				skipped.push({ label, reason });
				continue;
			}
			const slug = RAWG_SLUG.test(match.slug ?? '') ? match.slug : null;
			if (dryRun) {
				filled.push({ label, detail: `rawg.io/games/${slug}` });
				continue;
			}
			const url = await uploadCover(await encodeCover(match.background_image));
			const written = await db.execute({
				sql: 'UPDATE games SET cover_url = ?, cover_source_url = ?, rawg_slug = COALESCE(?, rawg_slug) WHERE id = ? AND cover_url IS NULL',
				args: [url, match.background_image, slug, game.id]
			});
			if (written.rowsAffected === 0) {
				skipped.push({ label, reason: `got a cover meanwhile; ${url} is unused` });
			} else {
				filled.push({ label, detail: `rawg.io/games/${slug}` });
			}
		} catch (err) {
			skipped.push({ label, reason: err instanceof Error ? err.message : String(err) });
		}
	}

	console.log(`${dryRun ? 'Would fill' : 'Filled'} ${filled.length}:`);
	for (const { label, detail } of filled) console.log(`  ✓ ${label} → ${detail}`);
	console.log(`\nLeft for the admin panel, ${skipped.length}:`);
	for (const { label, reason } of skipped) console.log(`  · ${label}: ${reason}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
