// Builds WORK/candidates.json — the games to work on, each with its current Normal primary.
//   node candidates.mjs --missing=pro|normal [--years=1990-2026] [--published]   games lacking a tier
//   node candidates.mjs --ids=12,34                                               these existing games
//   node candidates.mjs --new=<file>   new games, one "Name|Year" per line; refuses names already in the DB
// --append adds to an existing WORK/candidates.json (mix existing and new games).
// Prints the pool count (published games with a Pro primary) and a per-year summary.
import { existsSync, readFileSync } from 'fs';
import { db, readJson, writeJson, work } from './lib.mjs';

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const client = db('production');
const rows = async (sql, args = []) =>
	(await client.execute({ sql, args })).rows.map((r) => ({ ...r }));
const slugify = (s) =>
	s
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/[\s_]+/g, '-');

const SELECT = `select g.id, g.name, g.year, g.slug, g.rawg_slug, g.published,
	n.url nurl, n.source_url nsrc, p.url purl, p.source_url psrc
	from games g
	left join screenshots n on n.game_id = g.id and n.difficulty = 'normal' and n.is_primary = 1
	left join screenshots p on p.game_id = g.id and p.difficulty = 'pro' and p.is_primary = 1`;

let out;
if (arg('new')) {
	out = [];
	for (const line of readFileSync(arg('new'), 'utf8')
		.split('\n')
		.filter((l) => l.trim())) {
		const [name, year] = line.split('|').map((s) => s.trim());
		const slug = slugify(name);
		const clash = await rows(
			'select id, name, year from games where slug = ? or lower(name) = lower(?)',
			[slug, name]
		);
		if (clash.length) {
			console.log(`ALREADY IN DB: ${name} → ${JSON.stringify(clash)}`);
			continue;
		}
		out.push({
			key: `new-${slug}`,
			id: null,
			name,
			year: Number(year),
			slug,
			rawg_slug: null,
			nurl: null,
			nsrc: null
		});
	}
} else if (arg('ids')) {
	out = await rows(`${SELECT} where g.id in (${arg('ids').split(',').map(Number).join(',')})`);
} else {
	const tier = arg('missing');
	if (!['pro', 'normal'].includes(tier)) throw new Error('--missing=pro|normal, --ids= or --new=');
	const [from, to] = (arg('years') ?? '1900-2100').split('-').map(Number);
	const pub = process.argv.includes('--published') ? 'and g.published = 1' : '';
	out = await rows(
		`${SELECT} where g.year between ? and ? ${pub}
		and g.id not in (select game_id from screenshots where difficulty = ?) order by g.year, g.name`,
		[from, to, tier]
	);
}
for (const c of out) c.key ??= String(c.id);
if (process.argv.includes('--append') && existsSync(work('candidates.json'))) {
	const before = readJson(work('candidates.json'));
	out = [...before.filter((b) => !out.some((c) => c.key === b.key)), ...out];
}
writeJson(work('candidates.json'), out);

const pool =
	await rows(`select count(distinct g.id) n from games g join screenshots s on s.game_id = g.id
	where g.published = 1 and s.difficulty = 'pro' and s.is_primary = 1`);
const perYear = {};
for (const c of out) perYear[c.year] = (perYear[c.year] ?? 0) + 1;
console.log(`${out.length} candidates → ${work('candidates.json')}`);
console.log('per year:', JSON.stringify(perYear));
console.log(`published games with a Pro primary: ${pool[0].n}`);
