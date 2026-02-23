#!/usr/bin/env node

/**
 * import-games.cjs
 *
 * CLI tool for managing game entries in games.json.
 *
 * Usage:
 *   node scripts/import-games.cjs add "Game Name" 2023
 *   node scripts/import-games.cjs list
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES_PATH = path.join(ROOT, 'src', 'lib', 'data', 'games.json');

function readGames() {
	const raw = fs.readFileSync(GAMES_PATH, 'utf-8');
	return JSON.parse(raw);
}

function writeGames(games) {
	fs.writeFileSync(GAMES_PATH, JSON.stringify(games, null, '\t') + '\n', 'utf-8');
}

function slugify(name) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function addGame(name, year) {
	if (!name || !year) {
		console.error('Usage: node scripts/import-games.cjs add "Game Name" 2023');
		process.exit(1);
	}

	const yearNum = parseInt(year, 10);
	if (isNaN(yearNum) || yearNum < 1950 || yearNum > 2030) {
		console.error(`Invalid year: ${year}. Must be between 1950 and 2030.`);
		process.exit(1);
	}

	const games = readGames();

	// Check for duplicates
	const duplicate = games.find((g) => g.name.toLowerCase() === name.toLowerCase());
	if (duplicate) {
		console.error(`Game "${name}" already exists (id: ${duplicate.id}).`);
		process.exit(1);
	}

	// Auto-assign ID
	const maxId = games.reduce((max, g) => Math.max(max, g.id), 0);
	const newId = maxId + 1;

	const slug = slugify(name);
	const screenshot = `/screenshots/${slug}.svg`;

	const newGame = {
		id: newId,
		name,
		year: yearNum,
		screenshot
	};

	games.push(newGame);
	writeGames(games);

	console.log(`Added: "${name}" (${yearNum}) — id: ${newId}, screenshot: ${screenshot}`);

	// Regenerate placeholders
	console.log('\nRegenerating SVG placeholders...');
	execFileSync('node', ['scripts/generate-placeholders.cjs'], { cwd: ROOT, stdio: 'inherit' });
}

function listGames() {
	const games = readGames();
	console.log(`\n${games.length} games in database:\n`);
	const sorted = [...games].sort((a, b) => a.year - b.year);
	for (const g of sorted) {
		console.log(`  [${String(g.id).padStart(3)}] ${g.year}  ${g.name}`);
	}
	console.log('');
}

// --- Main ---
const [, , command, ...args] = process.argv;

switch (command) {
	case 'add':
		addGame(args[0], args[1]);
		break;
	case 'list':
		listGames();
		break;
	default:
		console.log('Usage:');
		console.log('  node scripts/import-games.cjs add "Game Name" 2023');
		console.log('  node scripts/import-games.cjs list');
		process.exit(1);
}
