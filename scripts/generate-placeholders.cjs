#!/usr/bin/env node

/**
 * generate-placeholders.js
 *
 * Reads games from src/lib/data/games.json and generates an SVG placeholder
 * image for each game at static/screenshots/{slug}.svg.
 *
 * Each SVG is 800x450 (16:9), has a dark gradient background with a unique
 * hue per game, and displays the game name as large centered text.
 * The release year is intentionally omitted because players must guess it.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GAMES_PATH = path.join(ROOT, 'src', 'lib', 'data', 'games.json');
const SCREENSHOTS_DIR = path.join(ROOT, 'static', 'screenshots');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive a deterministic hue (0-360) from the game id so every game gets a
 * visually distinct colour.  We use the golden-angle trick to spread hues
 * evenly around the colour wheel regardless of how many games we have.
 */
function hueForIndex(index, total) {
	const goldenAngle = 137.508; // degrees
	return Math.round((index * goldenAngle) % 360);
}

/**
 * Escape XML-special characters so game names render correctly inside SVG.
 */
function escapeXml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Choose a font-size that keeps the title inside the 800-wide viewport.
 * Rough heuristic: allow ~0.55em per character at a given size,
 * and keep at least 60 px padding on each side (720 px usable).
 */
function fontSizeForName(name) {
	const maxWidth = 720; // usable pixels
	const charWidthRatio = 0.55;
	// Start from 48 and shrink if the text would overflow
	let size = 48;
	while (size > 18 && name.length * size * charWidthRatio > maxWidth) {
		size -= 2;
	}
	return size;
}

/**
 * Build the SVG string for a single game.
 */
function buildSvg(game, index, total) {
	const hue = hueForIndex(index, total);
	const name = escapeXml(game.name);
	const fontSize = fontSizeForName(game.name);

	// We create two subtle decorative shapes to make it look less plain.
	// A large circle in the bottom-right and a smaller one in the top-left,
	// both using a slightly lighter shade of the same hue.

	return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 40%, 15%)" />
      <stop offset="100%" stop-color="hsl(${hue}, 50%, 8%)" />
    </linearGradient>
  </defs>

  <!-- background -->
  <rect width="800" height="450" fill="url(#bg)" />

  <!-- decorative circles -->
  <circle cx="680" cy="380" r="180" fill="hsl(${hue}, 45%, 18%)" opacity="0.35" />
  <circle cx="120" cy="70" r="100" fill="hsl(${hue}, 45%, 20%)" opacity="0.25" />

  <!-- small controller / gamepad icon hint (subtle) -->
  <text x="400" y="180" text-anchor="middle" font-family="sans-serif"
        font-size="64" fill="hsl(${hue}, 30%, 30%)" opacity="0.4">&#127918;</text>

  <!-- game title -->
  <text x="400" y="270" text-anchor="middle" dominant-baseline="middle"
        font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        font-size="${fontSize}" font-weight="700"
        fill="hsl(${hue}, 60%, 80%)"
        letter-spacing="1">${name}</text>

  <!-- subtle bottom label -->
  <text x="400" y="410" text-anchor="middle"
        font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        font-size="14" fill="hsl(${hue}, 30%, 45%)"
        letter-spacing="2">PLACEHOLDER</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
	// Read game data
	const raw = fs.readFileSync(GAMES_PATH, 'utf-8');
	const games = JSON.parse(raw);

	// Ensure output directory exists
	fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

	let created = 0;

	for (let i = 0; i < games.length; i++) {
		const game = games[i];
		// Derive filename from the screenshot path in games.json
		// e.g. "/screenshots/doom.svg" -> "doom.svg"
		const filename = path.basename(game.screenshot);
		const outputPath = path.join(SCREENSHOTS_DIR, filename);

		const svg = buildSvg(game, i, games.length);
		fs.writeFileSync(outputPath, svg, 'utf-8');
		created++;
		console.log(`  [${String(i + 1).padStart(2)}/${games.length}] ${filename}`);
	}

	console.log(`\nDone! Generated ${created} placeholder SVG(s) in ${SCREENSHOTS_DIR}`);
}

main();
