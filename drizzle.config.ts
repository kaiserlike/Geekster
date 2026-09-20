import { defineConfig } from 'drizzle-kit';
import { targetFromEnv, describeUrl } from './scripts/db-target.js';

// `DB_TARGET` names the stage — local (the default), staging or production — so
// that applying a migration to production never means editing `.env`.
// `TURSO_DATABASE_URL` is what the application reads and stays at
// `file:local.db`, which is what keeps the local admin panel away from
// production data while a migration is being applied to it.
//
//   npm run db:migrate              local
//   npm run db:migrate:staging      staging
//   npm run db:migrate:production   production
const target = targetFromEnv();

if (target.name !== 'local') {
	console.log(`drizzle: ${target.name} → ${describeUrl(target.url)}`);
}

export default defineConfig({
	schema: './src/lib/server/schema.ts',
	out: './drizzle',
	dialect: 'turso',
	dbCredentials: { url: target.url, authToken: target.authToken }
});
