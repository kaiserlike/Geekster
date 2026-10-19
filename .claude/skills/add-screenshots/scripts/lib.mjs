// Shared helpers for the add-screenshots skill. Every script runs from the repo root and keeps
// its state in a work directory (WORK env var, outside the repo — ESLint lints `scratchpad/`).
import { createRequire } from 'module';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

export const ROOT = process.cwd();
if (!existsSync(`${ROOT}/scripts/db-target.js`)) {
	throw new Error('Run this from the Geekster repo root.');
}
export const WORK = process.env.WORK;
if (!WORK) throw new Error('Set WORK to a work directory (the session scratchpad).');
mkdirSync(WORK, { recursive: true });

const require = createRequire(`${ROOT}/package.json`);
export const sharp = require('sharp');
const { createClient } = require('@libsql/client');
const { resolveTarget } = await import(`${ROOT}/scripts/db-target.js`);

/** Production, staging or local, resolved the same way as every repo tool. */
export function db(target = 'production') {
	const t = resolveTarget(target);
	return createClient({ url: t.url, authToken: t.authToken });
}

export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
export const writeJson = (path, data) => writeFileSync(path, JSON.stringify(data, null, 1));
export const work = (name) => `${WORK}/${name}`;

/** The panel's crop rules (src/lib/crop.ts): 16:9 from the width, longest edge ≤ 1600, never up. */
export const MAX_EDGE = 1600;
export const cropHeight = (w) => Math.round((w * 9) / 16);
export function outputSize(w, h) {
	if (w <= MAX_EDGE && h <= MAX_EDGE) return [w, h];
	const s = MAX_EDGE / Math.max(w, h);
	return [Math.round(w * s), Math.round(h * s)];
}

export async function rawgApi(path, params = {}) {
	const url = new URL(`https://api.rawg.io/api/${path}`);
	url.searchParams.set('key', process.env.RAWG_API_KEY);
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	const r = await fetch(url);
	if (!r.ok) throw new Error(`RAWG ${r.status} ${path}`);
	return r.json();
}

export const download = async (url) => Buffer.from(await (await fetch(url)).arrayBuffer());
