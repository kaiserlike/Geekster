import { defineConfig } from 'drizzle-kit';

const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db';

// The `turso` dialect validates `authToken` as a required non-empty string, but
// a `file:` URL is opened by @libsql/client without ever sending it. Without
// this placeholder `db:migrate` cannot run against the local database at all —
// the config's own `file:local.db` fallback would be unreachable.
const authToken = url.startsWith('file:') ? 'local' : process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
	schema: './src/lib/server/schema.ts',
	out: './drizzle',
	dialect: 'turso',
	dbCredentials: { url, authToken }
});
