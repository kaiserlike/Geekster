import { defineConfig, devices } from '@playwright/test';

// The end-to-end smoke tests (`npm run test:e2e`). They run against the production
// build served by `vite preview`, on a database made for the run: `e2e.db` is
// deleted, migrated from `drizzle/` and seeded from `games.json` before the server
// starts, so every run begins with the same 125 games, no runs and no Daily.
// The screenshots are the seed's local `/screenshots/<slug>.webp` paths, which is
// what lets a test look up a card's year in `games.json` (`tests/e2e/play.ts`).
//
// In CI they run only on pull requests to `main` (`.github/workflows/e2e.yml`).

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

export const E2E_ADMIN_PASSWORD = 'e2e-admin-password';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: process.env.CI ? [['github'], ['list']] : 'list',
	use: {
		baseURL: BASE_URL,
		trace: 'retain-on-failure'
	},
	projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
	webServer: {
		command: [
			'rm -f e2e.db',
			'npm run db:migrate',
			'npm run db:seed',
			'npm run build',
			`npm run preview -- --port ${PORT} --strictPort`
		].join(' && '),
		url: BASE_URL,
		// A server left running would bring yesterday's database with it.
		reuseExistingServer: false,
		timeout: 240_000,
		env: {
			TURSO_DATABASE_URL: 'file:e2e.db',
			TURSO_AUTH_TOKEN: '',
			ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
			PRO_MIN_POOL_OVERRIDE: ''
		}
	}
});
