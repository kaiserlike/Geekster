import { drizzle } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

let client: Client;

function getClient() {
	if (!client) {
		client = createClient({
			url: env.TURSO_DATABASE_URL ?? 'file:local.db',
			authToken: env.TURSO_AUTH_TOKEN
		});
	}
	return client;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_target, prop) {
		const instance = drizzle(getClient(), { schema });
		return Reflect.get(instance, prop);
	}
});
