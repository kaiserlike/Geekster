#!/usr/bin/env node
/**
 * Renders the brand assets into static/ from the real fonts and components (Sprint 9b).
 *
 * Each asset is a page at /styleguide/brand/<id>/ drawn at its exact pixel size (the list is
 * src/lib/brand.ts, served at /styleguide/brand/assets.json). This script opens every page in
 * headless Brave over the DevTools protocol, screenshots it, compresses it with sharp and writes
 * the PNG into static/, then packs favicon-16 + favicon-32 into favicon.ico (a PNG-in-ICO).
 *
 * Run on a laptop when the brand changes, never in CI. The output is committed.
 *
 * Usage:
 *   npm run dev                      # in another terminal
 *   npm run brand:render             # or: node scripts/render-brand-assets.cjs [--url=http://localhost:5173]
 *
 * Environment:
 *   BROWSER   path to a Chromium-based browser (default: Brave in /Applications)
 */
'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');

const STATIC_DIR = path.join(__dirname, '..', 'static');
const DEFAULT_URL = 'http://localhost:5173';
const DEFAULT_BROWSER = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const DEBUG_PORT = 9339;
/** WhatsApp drops a larger preview image */
const OG_MAX_BYTES = 300 * 1024;
const ICO_SIZES = ['favicon-16.png', 'favicon-32.png'];
const RENDER_ATTEMPTS = 3;

function parseArgs(argv) {
	const args = { url: DEFAULT_URL };
	for (const arg of argv) {
		if (arg.startsWith('--url=')) args.url = arg.slice('--url='.length).replace(/\/$/, '');
		else if (arg === '--help' || arg === '-h') {
			console.log('Usage: node scripts/render-brand-assets.cjs [--url=http://localhost:5173]');
			process.exit(0);
		} else {
			console.error(`Unknown argument: ${arg}`);
			process.exit(1);
		}
	}
	if (!/^https?:\/\//.test(args.url)) {
		console.error(`--url must be an http(s) URL, got ${args.url}`);
		process.exit(1);
	}
	return args;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForJson(url, attempts = 50) {
	for (let i = 0; i < attempts; i++) {
		try {
			const response = await fetch(url);
			if (response.ok) return await response.json();
		} catch {
			/* not up yet */
		}
		await sleep(200);
	}
	throw new Error(`No answer from ${url}`);
}

/** A minimal DevTools protocol client over Node's built-in WebSocket (Node 22+). */
function connect(wsUrl) {
	return new Promise((resolve, reject) => {
		const socket = new WebSocket(wsUrl);
		let nextId = 1;
		const pending = new Map();
		const listeners = new Set();
		socket.addEventListener('message', (event) => {
			const message = JSON.parse(event.data);
			if (message.id && pending.has(message.id)) {
				const { resolve: done, reject: fail } = pending.get(message.id);
				pending.delete(message.id);
				if (message.error) fail(new Error(`${message.error.message} (${message.error.code})`));
				else done(message.result);
			} else if (message.method) {
				for (const listener of listeners) listener(message);
			}
		});
		socket.addEventListener('error', () => reject(new Error(`Cannot connect to ${wsUrl}`)));
		socket.addEventListener('open', () =>
			resolve({
				send(method, params = {}, sessionId) {
					const id = nextId++;
					socket.send(JSON.stringify({ id, method, params, sessionId }));
					return new Promise((done, fail) => pending.set(id, { resolve: done, reject: fail }));
				},
				once(method, sessionId) {
					return new Promise((done) => {
						const listener = (message) => {
							if (message.method === method && message.sessionId === sessionId) {
								listeners.delete(listener);
								done(message.params);
							}
						};
						listeners.add(listener);
					});
				},
				close: () => socket.close()
			})
		);
	});
}

/** favicon.ico holding PNGs as-is: a 6-byte header, a 16-byte entry per image, the images. */
function packIco(pngs) {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(pngs.length, 4);
	let offset = 6 + 16 * pngs.length;
	const entries = pngs.map(({ size, data }) => {
		const entry = Buffer.alloc(16);
		entry.writeUInt8(size >= 256 ? 0 : size, 0);
		entry.writeUInt8(size >= 256 ? 0 : size, 1);
		entry.writeUInt8(0, 2); // no palette
		entry.writeUInt8(0, 3);
		entry.writeUInt16LE(1, 4); // colour planes
		entry.writeUInt16LE(32, 6); // bits per pixel
		entry.writeUInt32LE(data.length, 8);
		entry.writeUInt32LE(offset, 12);
		offset += data.length;
		return entry;
	});
	return Buffer.concat([header, ...entries, ...pngs.map(({ data }) => data)]);
}

/** Loads one brand page and waits for every font face and image it uses. */
async function renderPage(send, cdp, sessionId, pageUrl) {
	const loaded = cdp.once('Page.loadEventFired', sessionId);
	await send('Page.navigate', { url: pageUrl });
	await loaded;
	// Every face explicitly (a face nothing has used yet is not loading yet), then the images
	const ready = await send('Runtime.evaluate', {
		awaitPromise: true,
		returnByValue: true,
		expression: `(async () => {
				await Promise.all([
					document.fonts.load('400 40px "Dela Gothic One"'),
					document.fonts.load('500 16px "Chakra Petch"'),
					document.fonts.load('700 16px "Chakra Petch"'),
					document.fonts.load('400 16px "Exo 2"'),
					document.fonts.load('500 16px "Exo 2"'),
					document.fonts.load('600 16px "Exo 2"')
				]);
				await document.fonts.ready;
				await Promise.all([...document.images].map((img) => img.decode().catch(() => null)));
				await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
				const box = document.querySelector('[data-brand-asset]');
				const broken = [...document.images].filter((img) => !img.naturalWidth).map((img) => img.src);
				return {
					found: Boolean(box),
					display: document.fonts.check('400 40px "Dela Gothic One"'),
					broken
				};
			})()`
	});
	return ready.result.value;
}

async function compress(png, asset) {
	if (asset.id === 'og-image') {
		// A palette PNG keeps the flat synthwave colours and gets well under the 300 kB limit
		return sharp(png)
			.png({ palette: true, quality: 92, effort: 10, compressionLevel: 9 })
			.toBuffer();
	}
	return sharp(png).png({ compressionLevel: 9, effort: 10 }).toBuffer();
}

async function main() {
	const { url } = parseArgs(process.argv.slice(2));

	let assets;
	try {
		assets = await waitForJson(`${url}/styleguide/brand/assets.json`, 5);
	} catch {
		console.error(`The dev server does not answer at ${url}. Start it with \`npm run dev\` first.`);
		process.exit(1);
	}

	const browserPath = process.env.BROWSER || DEFAULT_BROWSER;
	if (!fs.existsSync(browserPath)) {
		console.error(`No browser at ${browserPath}. Set BROWSER to a Chromium-based browser.`);
		process.exit(1);
	}
	const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'geekster-brand-'));
	const browser = spawn(
		browserPath,
		[
			'--headless=new',
			`--remote-debugging-port=${DEBUG_PORT}`,
			`--user-data-dir=${profile}`,
			'--hide-scrollbars',
			'--force-color-profile=srgb',
			'--no-first-run',
			'about:blank'
		],
		{ stdio: 'ignore' }
	);

	let cdp;
	try {
		const version = await waitForJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
		cdp = await connect(version.webSocketDebuggerUrl);
		const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
		const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
		const send = (method, params) => cdp.send(method, params, sessionId);
		await send('Page.enable');

		const written = {};
		for (const asset of assets) {
			await send('Emulation.setDeviceMetricsOverride', {
				width: asset.width,
				height: asset.height,
				deviceScaleFactor: 1,
				mobile: false
			});
			await send(
				'Emulation.setDefaultBackgroundColorOverride',
				asset.transparent ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {}
			);
			// A dev server can drop a font request while Vite is still optimising; a reload fixes it
			let state;
			for (let attempt = 1; attempt <= RENDER_ATTEMPTS; attempt++) {
				state = await renderPage(send, cdp, sessionId, `${url}/styleguide/brand/${asset.id}/`);
				if (state.found && state.display && !state.broken.length) break;
			}
			if (!state.found)
				throw new Error(`/styleguide/brand/${asset.id}/ has no [data-brand-asset] box`);
			if (!state.display) throw new Error(`Dela Gothic One did not load for ${asset.id}`);
			if (state.broken.length)
				throw new Error(`Images failed for ${asset.id}: ${state.broken.join(', ')}`);

			const shot = await send('Page.captureScreenshot', {
				format: 'png',
				clip: { x: 0, y: 0, width: asset.width, height: asset.height, scale: 1 },
				captureBeyondViewport: false
			});
			const png = await compress(Buffer.from(shot.data, 'base64'), asset);
			if (asset.id === 'og-image' && png.length > OG_MAX_BYTES) {
				throw new Error(
					`og-image.png is ${Math.round(png.length / 1024)} kB, over the 300 kB limit`
				);
			}
			for (const output of asset.outputs) {
				fs.writeFileSync(path.join(STATIC_DIR, output), png);
				written[output] = png;
				console.log(
					`  ${output.padEnd(24)} ${asset.width}×${asset.height}  ${(png.length / 1024).toFixed(1)} kB`
				);
			}
		}

		const icoParts = ICO_SIZES.map((name) => {
			if (!written[name]) throw new Error(`favicon.ico needs ${name}, which was not rendered`);
			return { size: Number(name.match(/\d+/)[0]), data: written[name] };
		});
		const ico = packIco(icoParts);
		fs.writeFileSync(path.join(STATIC_DIR, 'favicon.ico'), ico);
		console.log(`  ${'favicon.ico'.padEnd(24)} 16 + 32     ${(ico.length / 1024).toFixed(1)} kB`);
	} finally {
		if (cdp) cdp.close();
		// The profile can only go once the browser has stopped writing to it
		const exited = new Promise((resolve) => browser.once('exit', resolve));
		browser.kill();
		await Promise.race([exited, sleep(5000)]);
		fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
	}
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
