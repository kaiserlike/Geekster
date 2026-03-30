import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env file if present
const envPath = join(__dirname, '..', '.env');
try {
	const envContent = readFileSync(envPath, 'utf-8');
	for (const line of envContent.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eqIndex = trimmed.indexOf('=');
		if (eqIndex === -1) continue;
		const key = trimmed.slice(0, eqIndex);
		const value = trimmed.slice(eqIndex + 1);
		if (!process.env[key]) process.env[key] = value;
	}
} catch {
	// No .env file — rely on env vars being set externally
}

const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });
const db = drizzle(client);

const gamesPath = join(__dirname, '..', 'src', 'lib', 'data', 'games.json');
const gamesData = JSON.parse(readFileSync(gamesPath, 'utf-8'));

console.log(`Seeding ${gamesData.length} games...`);

// Create tables if they don't exist
await client.execute(`
	CREATE TABLE IF NOT EXISTS games (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		slug TEXT UNIQUE NOT NULL,
		year INTEGER NOT NULL,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP
	)
`);

await client.execute(`
	CREATE TABLE IF NOT EXISTS screenshots (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		game_id INTEGER NOT NULL REFERENCES games(id),
		url TEXT NOT NULL,
		difficulty TEXT DEFAULT 'medium',
		is_primary INTEGER DEFAULT 1,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP
	)
`);

await client.execute(`
	CREATE TABLE IF NOT EXISTS scores (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		player_name TEXT NOT NULL,
		total_score INTEGER NOT NULL,
		correct_placements INTEGER,
		wrong_placements INTEGER,
		best_streak INTEGER,
		difficulty TEXT DEFAULT 'medium',
		created_at TEXT DEFAULT CURRENT_TIMESTAMP
	)
`);

// Clear existing data
await client.execute('DELETE FROM screenshots');
await client.execute('DELETE FROM games');

let inserted = 0;

for (const game of gamesData) {
	// Derive slug from screenshot path: /screenshots/super-mario-bros.webp -> super-mario-bros
	const slug = game.screenshot.replace('/screenshots/', '').replace('.webp', '');

	const result = await client.execute({
		sql: 'INSERT INTO games (name, slug, year) VALUES (?, ?, ?)',
		args: [game.name, slug, game.year]
	});

	const gameId = Number(result.lastInsertRowid);

	await client.execute({
		sql: 'INSERT INTO screenshots (game_id, url, difficulty, is_primary) VALUES (?, ?, ?, ?)',
		args: [gameId, game.screenshot, 'medium', 1]
	});

	inserted++;
}

console.log(`Seeded ${inserted} games with screenshots.`);
process.exit(0);
