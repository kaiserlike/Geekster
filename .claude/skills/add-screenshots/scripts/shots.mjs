// Image work for the add-screenshots skill, all inside WORK.
//   node shots.mjs fetch [key …]                   download current shots + RAWG shots (default: selection.json)
//   node shots.mjs sheet <key>                     contact sheet → sheets/<key>.jpg (current shots first)
//   node shots.mjs preview <key> <n> <x> <y> <w>   source with the crop box + the crop → previews/<key>_<n>.jpg
//   node shots.mjs render <proposals.json>         final WebPs → out/<key>-<tier>.webp + .json
//   node shots.mjs calibrate [n]                   n of the owner's Pro shots, source + box beside the result
// The crop width must be ≥ MIN_W (env, default 640; 480 for small 1990s sources).
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { cropHeight, db, download, outputSize, readJson, sharp, work, writeJson } from './lib.mjs';

const MIN_W = Number(process.env.MIN_W || 640);
const [cmd, ...args] = process.argv.slice(2);
const dir = (key) => work(`dl/${key}`);
const meta = (key) => readJson(`${dir(key)}/meta.json`);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const label = (text, w) =>
	Buffer.from(
		`<svg width="${w}" height="34"><rect width="${w}" height="34" fill="#000"/><text x="8" y="24" font-family="Helvetica" font-size="22" fill="#ff0">${esc(text)}</text></svg>`
	);

function check(m, n, x, y, w) {
	const s = m.shots[n - 1];
	if (!s) throw new Error(`${m.key}: no RAWG shot #${n}`);
	const h = cropHeight(w);
	if (x < 0 || y < 0 || x + w > s.w || y + h > s.h) {
		throw new Error(`${m.key}: crop ${x},${y} ${w}x${h} does not fit ${s.w}x${s.h}`);
	}
	if (w < MIN_W) throw new Error(`${m.key}: crop width ${w} < MIN_W ${MIN_W}`);
	return { s, h };
}

function selectedKeys() {
	const sel = readJson(work('selection.json'));
	return Object.values(sel).flatMap((v) => [...v.pick, ...(v.backup ?? [])].map(String));
}

if (cmd === 'fetch') {
	const rawg = readJson(work('rawg.json'));
	for (const key of args.length ? args : selectedKeys()) {
		const g = rawg[key];
		if (!g) throw new Error(`${key} is not in rawg.json`);
		if (existsSync(`${dir(key)}/meta.json`)) continue;
		mkdirSync(dir(key), { recursive: true });
		const current = {};
		for (const [tier, url] of [
			['normal', g.nurl],
			['pro', g.purl]
		]) {
			if (!url) continue;
			writeFileSync(`${dir(key)}/${tier}.img`, await download(url));
			const md = await sharp(`${dir(key)}/${tier}.img`).metadata();
			current[tier] = { w: md.width, h: md.height };
		}
		const shots = [];
		for (const [i, s] of g.shots.entries()) {
			const buf = await download(s.image);
			writeFileSync(`${dir(key)}/s${i + 1}.img`, buf);
			const md = await sharp(buf).metadata();
			shots.push({ n: i + 1, url: s.image, w: md.width, h: md.height });
		}
		writeJson(`${dir(key)}/meta.json`, {
			key,
			id: g.id,
			name: g.name,
			year: g.year,
			released: g.released,
			rawgPage: g.rawgPage,
			current,
			shots
		});
		console.log(key, g.name, shots.map((s) => `${s.w}x${s.h}`).join(' '));
	}
} else if (cmd === 'sheet') {
	const key = args[0];
	const m = meta(key);
	const CW = 760;
	const tiles = [
		...Object.entries(m.current).map(([tier, c]) => ({
			f: `${dir(key)}/${tier}.img`,
			t: `CURRENT ${tier.toUpperCase()} ${c.w}x${c.h}`
		})),
		...m.shots.map((s) => ({ f: `${dir(key)}/s${s.n}.img`, t: `#${s.n}  ${s.w}x${s.h}` }))
	];
	const imgs = [];
	for (const t of tiles) {
		const b = await sharp(t.f).resize(CW).jpeg().toBuffer();
		imgs.push({ b, h: (await sharp(b).metadata()).height, t: t.t });
	}
	const comp = [
		{
			input: label(`${m.name} (${m.year}) — RAWG released ${m.released}`, 2 * CW + 10),
			left: 0,
			top: 0
		}
	];
	let top = 40;
	for (let i = 0; i < imgs.length; i += 2) {
		const row = imgs.slice(i, i + 2);
		row.forEach((x, j) => {
			comp.push({ input: label(x.t, CW), left: j * (CW + 10), top });
			comp.push({ input: x.b, left: j * (CW + 10), top: top + 34 });
		});
		top += Math.max(...row.map((x) => x.h)) + 44;
	}
	mkdirSync(work('sheets'), { recursive: true });
	await sharp({ create: { width: 2 * CW + 10, height: top, channels: 3, background: '#333' } })
		.composite(comp)
		.jpeg({ quality: 82 })
		.toFile(work(`sheets/${key}.jpg`));
	console.log(work(`sheets/${key}.jpg`));
} else if (cmd === 'preview') {
	const [key, ...nums] = args;
	const [n, x, y, w] = nums.map(Number);
	const m = meta(key);
	const { s, h } = check(m, n, x, y, w);
	const src = `${dir(key)}/s${n}.img`;
	const W = 760;
	const k = W / s.w;
	const lh = Math.round(s.h * k);
	const box = Buffer.from(
		`<svg width="${W}" height="${lh}"><rect x="${x * k}" y="${y * k}" width="${w * k}" height="${h * k}" fill="none" stroke="#ff0" stroke-width="3"/></svg>`
	);
	const left = await sharp(src)
		.resize(W, lh)
		.composite([{ input: box }])
		.png()
		.toBuffer();
	const [ow, oh] = outputSize(w, h);
	const crop = await sharp(src)
		.extract({ left: x, top: y, width: w, height: h })
		.resize(ow, oh)
		.png()
		.toBuffer();
	mkdirSync(work('previews'), { recursive: true });
	await sharp({
		create: { width: Math.max(W, ow), height: lh + 10 + oh, channels: 3, background: '#333' }
	})
		.composite([
			{ input: left, left: 0, top: 0 },
			{ input: crop, left: 0, top: lh + 10 }
		])
		.jpeg({ quality: 85 })
		.toFile(work(`previews/${key}_${n}.jpg`));
	console.log(
		`${work(`previews/${key}_${n}.jpg`)}  crop ${w}x${h} = ${Math.round((100 * w) / s.w)}% of ${s.w}, output ${ow}x${oh}`
	);
} else if (cmd === 'render') {
	mkdirSync(work('out'), { recursive: true });
	for (const p of readJson(args[0])) {
		const key = String(p.key);
		const tier = p.tier ?? 'pro';
		const m = meta(key);
		const { s, h } = check(m, p.shot, p.x, p.y, p.w);
		const [ow, oh] = outputSize(p.w, h);
		const base = work(`out/${key}-${tier}`);
		await sharp(`${dir(key)}/s${p.shot}.img`)
			.extract({ left: p.x, top: p.y, width: p.w, height: h })
			.resize(ow, oh)
			.webp({ quality: 85 })
			.toFile(`${base}.webp`);
		writeJson(`${base}.json`, {
			key,
			id: m.id,
			name: m.name,
			year: m.year,
			tier,
			makePrimary: Boolean(p.makePrimary),
			shot: p.shot,
			sourceUrl: s.url,
			cropX: p.x,
			cropY: p.y,
			cropWidth: p.w,
			cropHeight: h,
			sourceWidth: s.w,
			sourceHeight: s.h,
			outW: ow,
			outH: oh,
			why: p.why ?? ''
		});
		console.log(key, tier, m.name, `${ow}x${oh}`);
	}
} else if (cmd === 'calibrate') {
	// The owner's existing Pro shots: source with the stored crop box beside the stored image.
	const count = Number(args[0] ?? 8);
	const r = await db('production')
		.execute(`select g.name, g.year, s.url, s.source_url, s.crop_x, s.crop_y,
		s.crop_width, s.crop_height from games g join screenshots s on s.game_id = g.id
		where g.published = 1 and s.difficulty = 'pro' and s.is_primary = 1 and s.source_url is not null
		and s.crop_width is not null order by random() limit ${count}`);
	mkdirSync(work('calib'), { recursive: true });
	for (const row of r.rows) {
		const src = await download(row.source_url);
		const md = await sharp(src).metadata();
		const W = 760;
		const k = W / md.width;
		const H = Math.round(md.height * k);
		const box = Buffer.from(
			`<svg width="${W}" height="${H}"><rect x="${row.crop_x * k}" y="${row.crop_y * k}" width="${row.crop_width * k}" height="${row.crop_height * k}" fill="none" stroke="#ff0" stroke-width="4"/></svg>`
		);
		const left = await sharp(src)
			.resize(W, H)
			.composite([{ input: box }])
			.png()
			.toBuffer();
		const right = await sharp(await download(row.url))
			.resize(W)
			.png()
			.toBuffer();
		const rh = (await sharp(right).metadata()).height;
		const file = work(`calib/${String(row.name).replace(/\W+/g, '_')}.jpg`);
		await sharp({
			create: { width: 2 * W + 10, height: Math.max(H, rh), channels: 3, background: '#222' }
		})
			.composite([
				{ input: left, left: 0, top: 0 },
				{ input: right, left: W + 10, top: 0 }
			])
			.jpeg({ quality: 80 })
			.toFile(file);
		console.log(
			file,
			`${row.year}`,
			`crop ${Math.round((100 * Number(row.crop_width)) / md.width)}% of ${md.width}`
		);
	}
} else {
	throw new Error('fetch | sheet | preview | render | calibrate');
}
