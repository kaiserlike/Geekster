// The review page for the user: per shot the game's current shots, the RAWG source with the crop
// box drawn in and the finished crop, plus name, year, tier and output size.
//   node overview.mjs <proposals.json> [title]   → WORK/overview/index.html (then `open` it)
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { readJson, sharp, work } from './lib.mjs';

const [file, title = 'Screenshots zur Freigabe'] = process.argv.slice(2);
const O = work('overview');
rmSync(O, { recursive: true, force: true });
mkdirSync(`${O}/img`, { recursive: true });
const esc = (s) =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/"/g, '&quot;');
const props = readJson(file).sort(
	(a, b) => a.year - b.year || String(a.key).localeCompare(String(b.key))
);

const cards = [];
for (const p of props) {
	const key = String(p.key);
	const tier = p.tier ?? 'pro';
	const r = readJson(work(`out/${key}-${tier}.json`));
	const m = readJson(work(`dl/${key}/meta.json`));
	const id = `${key}-${tier}`;
	const figs = [];
	for (const t of Object.keys(m.current)) {
		await sharp(work(`dl/${key}/${t}.img`))
			.resize(960, null, { withoutEnlargement: true })
			.jpeg({ quality: 85 })
			.toFile(`${O}/img/${id}_cur_${t}.jpg`);
		figs.push(
			`<figure><img src="img/${id}_cur_${t}.jpg" loading="lazy"><figcaption>${t === 'pro' ? 'Pro' : 'Normal'} (aktuell)</figcaption></figure>`
		);
	}
	if (!figs.length)
		figs.push(
			'<figure class="none"><div>noch kein Shot</div><figcaption>neues Spiel</figcaption></figure>'
		);
	const W = 960;
	const k = W / r.sourceWidth;
	const H = Math.round(r.sourceHeight * k);
	const box = Buffer.from(
		`<svg width="${W}" height="${H}"><rect x="${r.cropX * k}" y="${r.cropY * k}" width="${r.cropWidth * k}" height="${r.cropHeight * k}" fill="none" stroke="#ffd400" stroke-width="4"/></svg>`
	);
	await sharp(work(`dl/${key}/s${r.shot}.img`))
		.resize(W, H)
		.composite([{ input: box }])
		.jpeg({ quality: 85 })
		.toFile(`${O}/img/${id}_source.jpg`);
	copyFileSync(work(`out/${id}.webp`), `${O}/img/${id}.webp`);
	const pct = Math.round((100 * r.cropWidth) / r.sourceWidth);
	const ry = (m.released ?? '').slice(0, 4);
	const badges = [
		`<span class="b ${tier}">${tier.toUpperCase()}</span>`,
		r.id ? '' : '<span class="b new">NEUES SPIEL</span>',
		r.makePrimary ? '<span class="b warn">ersetzt Primary</span>' : '',
		r.outW < 640 ? '<span class="b warn">klein</span>' : '',
		ry && ry !== String(r.year) ? `<span class="b warn">RAWG ${ry}</span>` : ''
	].join(' ');
	cards.push(`<section><h2><span class="yr">${r.year}</span> ${esc(r.name)} <small>${r.id ? `id ${r.id}` : esc(key)}</small> ${badges}</h2>
<p class="meta">RAWG #${r.shot} ${r.sourceWidth}×${r.sourceHeight} · crop ${r.cropX},${r.cropY} ${r.cropWidth}×${r.cropHeight} (${pct} %) · <b>output ${r.outW}×${r.outH}</b>${m.rawgPage ? ` · <a href="${m.rawgPage}" target="_blank">RAWG</a>` : ''}</p>
<p class="why">${esc(r.why)}</p>
<div class="row"><div class="cur">${figs.join('')}</div>
<figure><img src="img/${id}_source.jpg" loading="lazy"><figcaption>Quelle mit Crop</figcaption></figure>
<figure class="res"><a href="img/${id}.webp" target="_blank"><img src="img/${id}.webp" loading="lazy"></a><figcaption>neu (klick = volle Größe)</figcaption></figure></div></section>`);
}
writeFileSync(
	`${O}/index.html`,
	`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Screenshot Review</title>
<style>:root{color-scheme:dark}body{background:#14151a;color:#e8e8ea;font:15px/1.45 system-ui,sans-serif;margin:0;padding:16px}
h1{font-size:22px}section{border-top:1px solid #333;padding:14px 0}h2{font-size:18px;margin:0 0 4px}h2 small{color:#888;font-weight:400}
a{color:#9cf}.yr{background:#ffd400;color:#000;border-radius:4px;padding:0 6px;margin-right:6px}.meta{color:#aaa;margin:0}.why{margin:4px 0 8px;color:#ccc}
.b{font-size:12px;border-radius:4px;padding:1px 6px;vertical-align:middle}.b.pro{background:#7a3cff}.b.normal{background:#2a7}.b.new{background:#08c}.b.warn{background:#c33}
.row{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:10px}.cur{display:grid;gap:6px}figure{margin:0}img{width:100%;display:block;border-radius:4px}
.none div{aspect-ratio:16/9;border:1px dashed #555;border-radius:4px;display:grid;place-items:center;color:#777}
figcaption{color:#888;font-size:12px}.res img{outline:2px solid #ffd400}@media(max-width:800px){.row{grid-template-columns:1fr}}</style>
<h1>${esc(title)} — ${props.length}</h1><p>Sag per id, was raus soll oder neu gemacht werden muss.</p>${cards.join('\n')}`
);
if (!existsSync(`${O}/index.html`)) throw new Error('overview not written');
console.log(`${O}/index.html`, props.length);
