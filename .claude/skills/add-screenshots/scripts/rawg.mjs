// Resolves every candidate on RAWG: the game, its release year and its screenshots, minus the
// images the game's current Normal and Pro were cut from. Resumable: keeps WORK/rawg.json.
//   node rawg.mjs [--slug=<key>:<rawg-slug> …]   override a wrong match, e.g. --slug=17:resident-evil-4
// Prints one line per game: RAWG name and year (flagged when it differs), how it matched, widths.
import { existsSync } from 'fs';
import { rawgApi, readJson, writeJson, work } from './lib.mjs';

const cands = readJson(work('candidates.json'));
const file = work('rawg.json');
const out = existsSync(file) ? readJson(file) : {};
const overrides = Object.fromEntries(
	process.argv.filter((a) => a.startsWith('--slug=')).map((a) => a.slice(7).split(':'))
);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const fileOf = (url) => (url ?? '').split('/').pop();

for (const c of cands) {
	if (overrides[c.key]) delete out[c.key];
	if (out[c.key]) continue;
	try {
		let slug = overrides[c.key] ?? c.rawg_slug;
		let how = overrides[c.key] ? 'override' : 'db';
		if (!slug) {
			const res = (await rawgApi('games', { search: c.name, page_size: 10 })).results;
			const exact = res.filter((r) => norm(r.name) === norm(c.name));
			const pick = exact.find((r) => r.released?.startsWith(String(c.year))) ?? exact[0] ?? res[0];
			slug = pick?.slug;
			how = exact.length ? 'search-exact' : 'search-FIRST';
		}
		const detail = await rawgApi(`games/${slug}`);
		const shots = (await rawgApi(`games/${slug}/screenshots`, { page_size: 40 })).results;
		const used = new Set([fileOf(c.nsrc), fileOf(c.psrc)].filter(Boolean));
		out[c.key] = {
			...c,
			rawg: slug,
			how,
			rawgName: detail.name,
			released: detail.released,
			rawgPage: `https://rawg.io/games/${slug}`,
			shots: shots
				.filter((s) => !used.has(fileOf(s.image)))
				.map((s) => ({ image: s.image, w: s.width, h: s.height }))
		};
	} catch (e) {
		console.log('ERR', c.key, c.name, e.message);
		continue;
	}
	writeJson(file, out);
}

for (const g of Object.values(out).sort((a, b) => a.year - b.year)) {
	const ry = (g.released ?? '????').slice(0, 4);
	const flag = ry === String(g.year) ? '' : ` YEAR ${ry}!`;
	const widths = g.shots.map((s) => s.w).sort((a, b) => b - a);
	console.log(
		`${g.year} ${g.key} ${g.name} → ${g.rawgName} [${g.how}]${flag} ${JSON.stringify(widths)}`
	);
}
