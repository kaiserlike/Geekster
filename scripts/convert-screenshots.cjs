#!/usr/bin/env node

/**
 * Converts all .jpg screenshots to .webp with good quality and smaller file size.
 * Also updates games.json to reference the new .webp files.
 *
 * Usage:
 *   node scripts/convert-screenshots.cjs
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'static', 'screenshots');
const GAMES_PATH = path.join(__dirname, '..', 'src', 'lib', 'data', 'games.json');

async function main() {
	const files = fs.readdirSync(SCREENSHOTS_DIR).filter((f) => f.endsWith('.jpg'));

	if (files.length === 0) {
		console.log('No .jpg files found to convert.');
		return;
	}

	console.log(`Converting ${files.length} screenshots to WebP...\n`);

	let totalOriginal = 0;
	let totalConverted = 0;

	for (const file of files) {
		const jpgPath = path.join(SCREENSHOTS_DIR, file);
		const webpFile = file.replace('.jpg', '.webp');
		const webpPath = path.join(SCREENSHOTS_DIR, webpFile);

		const originalSize = fs.statSync(jpgPath).size;
		totalOriginal += originalSize;

		try {
			await sharp(jpgPath)
				.resize({ width: 960, withoutEnlargement: true })
				.webp({ quality: 75 })
				.toFile(webpPath);

			const newSize = fs.statSync(webpPath).size;
			totalConverted += newSize;
			const savings = Math.round((1 - newSize / originalSize) * 100);

			console.log(
				`  ${file} → ${webpFile}  (${formatSize(originalSize)} → ${formatSize(newSize)}, -${savings}%)`
			);

			// Remove the original jpg
			fs.unlinkSync(jpgPath);
		} catch (err) {
			console.log(`  ✗ ${file} — error: ${err.message}`);
			totalConverted += originalSize;
		}
	}

	// Update games.json
	const games = JSON.parse(fs.readFileSync(GAMES_PATH, 'utf-8'));
	for (const game of games) {
		game.screenshot = game.screenshot.replace('.jpg', '.webp');
	}
	fs.writeFileSync(GAMES_PATH, JSON.stringify(games, null, '\t') + '\n');

	console.log(
		`\nDone! ${formatSize(totalOriginal)} → ${formatSize(totalConverted)} (${Math.round((1 - totalConverted / totalOriginal) * 100)}% smaller)`
	);
}

function formatSize(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
