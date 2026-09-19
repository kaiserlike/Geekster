// Loads key=value pairs from the project's .env file into process.env.
// Existing environment variables always win, so CI/production values are never
// overwritten by a stale local file.
//
// Usage: import './load-env.js' at the top of a node script.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
	const envContent = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
	for (const line of envContent.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eqIndex = trimmed.indexOf('=');
		if (eqIndex === -1) continue;
		const key = trimmed.slice(0, eqIndex).trim();
		// `vercel env pull` writes quoted values — strip a matching pair of quotes
		const value = trimmed.slice(eqIndex + 1).replace(/^(["'])(.*)\1$/, '$2');
		if (!process.env[key]) process.env[key] = value;
	}
} catch {
	// No .env file — rely on env vars being set externally
}
