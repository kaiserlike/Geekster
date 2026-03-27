#!/usr/bin/env node

/**
 * Fetches real game screenshots from the RAWG API.
 *
 * Usage:
 *   RAWG_API_KEY=your_key node scripts/fetch-screenshots.cjs
 *   RAWG_API_KEY=your_key node scripts/fetch-screenshots.cjs --force   # re-download all
 *
 * Get a free API key at: https://rawg.io/apidocs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.RAWG_API_KEY;
if (!API_KEY) {
	console.error('Error: Set RAWG_API_KEY environment variable.');
	console.error('Get a free key at: https://rawg.io/apidocs');
	process.exit(1);
}

const FORCE = process.argv.includes('--force');

const GAMES_PATH = path.join(__dirname, '..', 'src', 'lib', 'data', 'games.json');
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'static', 'screenshots');

// Some games need different search terms to match correctly on RAWG
const SEARCH_OVERRIDES = {
	'Sonic the Hedgehog': 'Sonic the Hedgehog 1991',
	'The Legend of Zelda': 'The Legend of Zelda 1986 NES',
	'God of War': 'God of War 2018',
	'SimCity': 'SimCity 1989',
	'Counter-Strike': 'Counter-Strike 2000',
	'Among Us': 'Among Us 2018',
	'Fortnite': 'Fortnite Battle Royale',
	'Overwatch': 'Overwatch 2016',
	'Fable': 'Fable 2004',
	'Control': 'Control 2019 Remedy',
	'Inside': 'Inside 2016 Playdead',
	'Journey': 'Journey 2012 thatgamecompany',
	'Limbo': 'Limbo 2010 Playdead',
	'Tomb Raider': 'Tomb Raider 2013',
	'Doom (2016)': 'Doom 2016',
	'Titanfall': 'Titanfall 2014',
	'Stray': 'Stray 2022 cat',
	'Metroid': 'Metroid 1986 NES',
	'Prince of Persia': 'Prince of Persia 1989',
	'Resident Evil': 'Resident Evil 1996',
	'Tomb Raider (1996)': 'Tomb Raider 1996',
	'Crash Bandicoot': 'Crash Bandicoot 1996',
	'Quake': 'Quake 1996 id Software',
	'Contra': 'Contra 1987 NES',
	'EarthBound': 'EarthBound 1994 SNES',
	'Myst': 'Myst 1993'
};

function httpsGet(url) {
	return new Promise((resolve, reject) => {
		https.get(url, (res) => {
			if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
				return httpsGet(res.headers.location).then(resolve, reject);
			}
			const chunks = [];
			res.on('data', (chunk) => chunks.push(chunk));
			res.on('end', () => {
				if (res.statusCode !== 200) {
					reject(new Error(`HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString()}`));
				} else if (res.headers['content-type']?.includes('application/json')) {
					resolve(JSON.parse(Buffer.concat(chunks).toString()));
				} else {
					resolve(Buffer.concat(chunks));
				}
			});
			res.on('error', reject);
		}).on('error', reject);
	});
}

function downloadFile(url, destPath) {
	return new Promise((resolve, reject) => {
		const request = (downloadUrl) => {
			const mod = downloadUrl.startsWith('https') ? https : require('http');
			mod.get(downloadUrl, (res) => {
				if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
					return request(res.headers.location);
				}
				if (res.statusCode !== 200) {
					reject(new Error(`Download failed: HTTP ${res.statusCode}`));
					return;
				}
				const file = fs.createWriteStream(destPath);
				res.pipe(file);
				file.on('finish', () => {
					file.close();
					resolve();
				});
				file.on('error', (err) => {
					fs.unlink(destPath, () => {});
					reject(err);
				});
			}).on('error', reject);
		};
		request(url);
	});
}

async function searchGame(name, year) {
	const searchTerm = SEARCH_OVERRIDES[name] || name;
	const url = `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(searchTerm)}&page_size=5`;
	const data = await httpsGet(url);

	if (!data.results || data.results.length === 0) return null;

	// Try to find a result matching the year
	const match =
		data.results.find(
			(r) => r.released && parseInt(r.released.substring(0, 4)) === year
		) || data.results[0];

	return match;
}

async function getScreenshots(gameId) {
	const url = `https://api.rawg.io/api/games/${gameId}/screenshots?key=${API_KEY}`;
	const data = await httpsGet(url);
	return data.results || [];
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
	const games = JSON.parse(fs.readFileSync(GAMES_PATH, 'utf-8'));

	console.log(`Fetching screenshots for ${games.length} games...${FORCE ? ' (--force: re-downloading all)' : ''}\n`);

	let updated = 0;
	let failed = 0;

	for (const game of games) {
		const slug = game.screenshot
			.replace('/screenshots/', '')
			.replace('.svg', '')
			.replace('.jpg', '')
			.replace('.webp', '');
		const jpgPath = path.join(SCREENSHOTS_DIR, `${slug}.jpg`);

		// Skip if jpg already exists (unless --force)
		if (fs.existsSync(jpgPath) && !FORCE) {
			console.log(`✓ ${game.name} — already has screenshot (use --force to re-download)`);
			game.screenshot = `/screenshots/${slug}.jpg`;
			updated++;
			continue;
		}

		try {
			// Search for the game
			const result = await searchGame(game.name, game.year);
			if (!result) {
				console.log(`✗ ${game.name} — not found on RAWG`);
				failed++;
				await sleep(250);
				continue;
			}

			// Prefer gameplay screenshots (skip first which is often title/promo art)
			let imageUrl = null;
			const screenshots = await getScreenshots(result.id);
			if (screenshots.length > 2) {
				// Pick a middle screenshot — more likely to be gameplay, less likely to show title
				const idx = Math.min(2, screenshots.length - 1);
				imageUrl = screenshots[idx].image;
			} else if (screenshots.length > 0) {
				imageUrl = screenshots[screenshots.length - 1].image;
			} else if (result.background_image) {
				imageUrl = result.background_image;
			}

			if (!imageUrl) {
				console.log(`✗ ${game.name} — no screenshots available`);
				failed++;
				await sleep(250);
				continue;
			}

			// Download the image
			await downloadFile(imageUrl, jpgPath);
			game.screenshot = `/screenshots/${slug}.jpg`;
			updated++;
			console.log(`✓ ${game.name} — downloaded`);
		} catch (err) {
			console.log(`✗ ${game.name} — error: ${err.message}`);
			failed++;
		}

		// Rate limit: ~4 requests/second
		await sleep(250);
	}

	// Update games.json
	fs.writeFileSync(GAMES_PATH, JSON.stringify(games, null, '\t') + '\n');

	console.log(`\nDone! ${updated} downloaded, ${failed} failed.`);

	if (failed > 0) {
		console.log('Re-run the script to retry failed games, or add screenshots manually.');
	}
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
