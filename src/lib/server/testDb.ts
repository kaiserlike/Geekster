// The database for integration tests: an in-memory libSQL with the real migrations from
// `drizzle/` applied, so a test runs against the schema production has, indexes included. A
// test file replaces `./db` with this module and calls `freshDb()` before each test:
//
//   vi.mock('./db', () => import('./testDb'));
//   beforeEach(async () => { await freshDb(); });
//
// Nothing in the app imports it; it never reads `TURSO_*`, so a test cannot reach a live stage.

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { games, runs, screenshots } from './schema';
import type { Difficulty } from '$lib/screenshotTiers';

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

let current: TestDb | null = null;

/** Stands in for `db` from `./db`: whatever database the last `freshDb()` made */
export const db = new Proxy({} as TestDb, {
	get(_target, prop) {
		if (!current) throw new Error('testDb: call freshDb() before the test touches the database');
		return Reflect.get(current, prop);
	}
});

/** An empty database at the latest migration; `db` points at it from now on */
export async function freshDb(): Promise<TestDb> {
	const fresh = drizzle(createClient({ url: ':memory:' }), { schema });
	await migrate(fresh, { migrationsFolder: 'drizzle' });
	current = fresh;
	return fresh;
}

export interface GameSpec {
	name: string;
	year: number;
	/** The tiers it has a primary screenshot in; Normal only by default */
	tiers?: Difficulty[];
	published?: boolean;
}

export interface SeededGame {
	id: number;
	name: string;
	year: number;
}

/** Inserts games with their primary screenshots; the result is keyed by game id */
export async function seedGames(specs: GameSpec[]): Promise<Map<number, SeededGame>> {
	const seeded = new Map<number, SeededGame>();
	for (const spec of specs) {
		const slug = spec.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
		const [row] = await db
			.insert(games)
			.values({
				name: spec.name,
				slug,
				year: spec.year,
				published: spec.published === false ? 0 : 1
			})
			.returning({ id: games.id });
		for (const tier of spec.tiers ?? ['normal']) {
			await db.insert(screenshots).values({
				gameId: row.id,
				url: `https://blob.test/${slug}-${tier}.webp`,
				difficulty: tier,
				isPrimary: 1
			});
		}
		seeded.set(row.id, { id: row.id, name: spec.name, year: spec.year });
	}
	return seeded;
}

/** `count` published games with a Normal primary, one year apart from 1980 on */
export function normalGames(count: number, tiers: Difficulty[] = ['normal']): GameSpec[] {
	return Array.from({ length: count }, (_v, i) => ({
		name: `Game ${i + 1}`,
		year: 1980 + i,
		tiers
	}));
}

/** The run's row as stored, for tests that need to know what the server dealt */
export async function runRow(id: string): Promise<typeof runs.$inferSelect> {
	const [row] = await db.select().from(runs).where(eq(runs.id, id));
	if (!row) throw new Error(`testDb: no run ${id}`);
	return row;
}
