import { sql } from 'drizzle-orm';
import { db } from './db';
import { shareCounts } from './schema';
import { utcDay } from '$lib/daily';
import type { ShareEvent } from '$lib/share';

/** One more share of that kind and method today (UTC); nothing about who shared (10f-1) */
export async function countShare(event: ShareEvent, now = new Date()): Promise<void> {
	await db
		.insert(shareCounts)
		.values({ date: utcDay(now), kind: event.kind, method: event.method, count: 1 })
		.onConflictDoUpdate({
			target: [shareCounts.date, shareCounts.kind, shareCounts.method],
			set: { count: sql`${shareCounts.count} + 1` }
		});
}
