// Uploads approved shots to production through the admin panel's own actions, and checks each
// one in the database afterwards. Run only after the user approved the overview page.
//   node upload.mjs <approved.json> [--dry-run] [--only=<key>] [--publish] [--stop-pro-at=N]
// Existing game: POST /admin/games/<id>/?/upload. New game: POST /admin/games/new/ (a draft unless
// --publish) with its first shot, Normal first, then any further shot through ?/upload.
// Resumable: a shot whose source_url is already stored for that game and tier is skipped, and a
// new game that already exists by slug or name is reused. Log: WORK/upload_log.jsonl.
import { appendFileSync, readFileSync } from 'fs';
import { db, readJson, work } from './lib.mjs';

const BASE = 'https://geekster.pro';
const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const dry = args.includes('--dry-run');
const publish = args.includes('--publish');
const stopProAt = flag('stop-pro-at') ? Number(flag('stop-pro-at')) : null;
const client = db('production');
const one = async (sql, a = []) => (await client.execute({ sql, args: a })).rows[0];
const log = (o) =>
	appendFileSync(
		work('upload_log.jsonl'),
		JSON.stringify({ at: new Date().toISOString(), ...o }) + '\n'
	);
const proPool = async () =>
	Number(
		(
			await one(`select count(distinct g.id) n from games g join screenshots s on s.game_id = g.id
			where g.published = 1 and s.difficulty = 'pro' and s.is_primary = 1`)
		).n
	);

let items = readJson(args[0]).map((p) => readJson(work(`out/${p.key}-${p.tier ?? 'pro'}.json`)));
if (flag('only')) items = items.filter((r) => r.key === flag('only'));
// Normal before Pro, so a new game is created with its Normal shot.
items.sort((a, b) => a.key.localeCompare(b.key) || (a.tier === 'normal' ? -1 : 1));

let cookie = null;
if (!dry) {
	const r = await fetch(`${BASE}/admin/login/`, {
		method: 'POST',
		body: new URLSearchParams({ password: process.env.ADMIN_PASSWORD }),
		redirect: 'manual',
		headers: { Origin: BASE, Accept: 'text/html' }
	});
	cookie = r.headers
		.getSetCookie()
		.map((c) => c.split(';')[0])
		.find((c) => c.startsWith('geekster_admin='));
	if (r.status !== 303 || !cookie) throw new Error(`login failed: ${r.status}`);
}

function shotForm(r) {
	const form = new FormData();
	form.set(
		'screenshot',
		new Blob([readFileSync(work(`out/${r.key}-${r.tier}.webp`))], { type: 'image/webp' }),
		`${r.key}.webp`
	);
	form.set('difficulty', r.tier);
	form.set('sourceUrl', r.sourceUrl);
	for (const k of ['cropX', 'cropY', 'cropWidth', 'cropHeight', 'sourceWidth', 'sourceHeight'])
		form.set(k, String(r[k]));
	return form;
}
const post = (path, form) =>
	fetch(`${BASE}${path}`, {
		method: 'POST',
		body: form,
		redirect: 'manual',
		headers: { Origin: BASE, Accept: 'text/html', Cookie: cookie }
	});

const newIds = {};
for (const r of items) {
	let id = r.id ?? newIds[r.key];
	if (!id) {
		const found = await one('select id from games where lower(name) = lower(?) and year = ?', [
			r.name,
			r.year
		]);
		if (found) id = newIds[r.key] = Number(found.id);
	}
	if (id) {
		const dup = await one(
			'select id from screenshots where game_id = ? and difficulty = ? and source_url = ?',
			[id, r.tier, r.sourceUrl]
		);
		if (dup) {
			console.log('SKIP already stored', r.key, r.tier, r.name);
			continue;
		}
	}
	if (r.tier === 'pro' && stopProAt !== null) {
		const n = await proPool();
		if (n >= stopProAt) {
			console.log(`STOP: ${n} published games with a Pro primary (--stop-pro-at=${stopProAt})`);
			log({ stop: n });
			break;
		}
	}
	if (dry) {
		console.log('would upload', r.key, r.tier, r.name, id ? `to game ${id}` : 'as a NEW game');
		continue;
	}

	let status;
	if (!id) {
		const form = shotForm(r);
		form.set('name', r.name);
		form.set('year', String(r.year));
		if (!publish) form.set('draft', 'on');
		const res = await post('/admin/games/new/', form);
		status = res.status;
		const loc = res.headers.get('location') ?? '';
		id = newIds[r.key] = Number(loc.match(/\/admin\/games\/(\d+)/)?.[1]);
		if (!id) throw new Error(`creating ${r.name} failed: ${status} ${loc}`);
		if (loc.includes('warning=')) console.log('WARNING from the panel:', loc);
	} else {
		const form = shotForm(r);
		if (r.makePrimary) form.set('makePrimary', '1');
		status = (await post(`/admin/games/${id}/?/upload`, form)).status;
	}

	const row = await one(
		'select id, url, is_primary, crop_width from screenshots where game_id = ? and difficulty = ? and source_url = ? order by id desc limit 1',
		[id, r.tier, r.sourceUrl]
	);
	const blob = row ? (await fetch(row.url, { method: 'HEAD' })).status : null;
	const ok = row && Number(row.crop_width) === r.cropWidth && blob === 200;
	log({
		key: r.key,
		id,
		tier: r.tier,
		name: r.name,
		status,
		ok,
		primary: row?.is_primary,
		url: row?.url
	});
	console.log(
		ok ? 'OK' : 'FAILED',
		r.key,
		r.tier,
		r.name,
		`game ${id}`,
		`http ${status}`,
		`primary ${row?.is_primary}`,
		`blob ${blob}`
	);
	if (!ok) {
		console.log('stopping on failure');
		break;
	}
}
console.log('published games with a Pro primary:', await proPool());
