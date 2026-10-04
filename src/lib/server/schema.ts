import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const games = sqliteTable('games', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	slug: text('slug').unique().notNull(),
	year: integer('year').notNull(),
	// Default 1 so every existing row, `db:seed` and the bulk import keep
	// behaving exactly as they did before draft mode existed.
	published: integer('published').default(1),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const screenshots = sqliteTable(
	'screenshots',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		gameId: integer('game_id')
			.references(() => games.id)
			.notNull(),
		url: text('url').notNull(),
		// `normal | pro` since migration 0003. NOT NULL because a null tier would
		// slip past both the primary index and every per-mode filter.
		difficulty: text('difficulty').notNull().default('normal'),
		isPrimary: integer('is_primary').default(1),
		// Where the image came from: the rawg.io URL for a RAWG import, null for a file.
		sourceUrl: text('source_url'),
		// The crop rectangle in source pixels. Written from Sprint 8 slice 3 on.
		cropX: integer('crop_x'),
		cropY: integer('crop_y'),
		cropWidth: integer('crop_width'),
		cropHeight: integer('crop_height'),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
	},
	(table) => [
		// One primary per (game, tier), enforced by the database and not only by
		// `reconcilePrimaries()`.
		uniqueIndex('screenshots_primary_per_difficulty')
			.on(table.gameId, table.difficulty)
			.where(sql`is_primary = 1`)
	]
);

export const scores = sqliteTable(
	'scores',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		playerName: text('player_name').notNull(),
		totalScore: integer('total_score').notNull(),
		correctPlacements: integer('correct_placements'),
		wrongPlacements: integer('wrong_placements'),
		bestStreak: integer('best_streak'),
		difficulty: text('difficulty').default('normal'),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		// The run that earned it (Sprint 10b, migration 0004). Null only for the rows from before
		// the referee; every score since is written by the server at the end of a run, once.
		runId: text('run_id'),
		deviceId: text('device_id'),
		// The UTC day of a Daily Run's score (Sprint 10d, migration 0005); null for an endless run
		dailyDate: text('daily_date')
	},
	(table) => [uniqueIndex('scores_run_id_unique').on(table.runId)]
);

/**
 * A run refereed by the server (Sprint 10b). A serverless function has no memory between
 * requests, so everything a run knows lives here; the client only ever holds the run's id,
 * which is its one credential. The timeline is not stored: it is the first `position` games
 * of `game_ids`, sorted by year.
 */
export const runs = sqliteTable(
	'runs',
	{
		// 32 random hex characters, unguessable
		id: text('id').primaryKey(),
		// `normal | pro | daily`; a Daily Run plays and scores as Normal (10d)
		mode: text('mode').notNull(),
		deviceId: text('device_id'),
		// The run's order, a JSON array of game ids: the anchor first
		gameIds: text('game_ids').notNull(),
		// Index in `game_ids` of the card in play: 1 is the first card after the anchor
		position: integer('position').notNull().default(1),
		// `placing | bonus | revealed | over` — see `RunStage` in `runRules.ts`
		stage: text('stage').notNull().default('placing'),
		lives: integer('lives').notNull(),
		streak: integer('streak').notNull().default(0),
		bestStreak: integer('best_streak').notNull().default(0),
		livesWonBack: integer('lives_won_back').notNull().default(0),
		totalScore: integer('total_score').notNull().default(0),
		correct: integer('correct').notNull().default(0),
		wrong: integer('wrong').notNull().default(0),
		// Epoch milliseconds; a bonus guess arriving later is scored as skipped
		bonusDeadline: integer('bonus_deadline'),
		// `outOfLives | poolCleared`, once over
		endReason: text('end_reason'),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		finishedAt: text('finished_at'),
		// The UTC day of a Daily Run (Sprint 10d, migration 0005); null for an endless run
		dailyDate: text('daily_date'),
		// One character per placed card, `o` a hit and `x` a miss: the result screen's misses and the
		// Daily's share row (10d)
		marks: text('marks').notNull().default('')
	},
	// One Daily Run per device and day (decision 2026-10-04). A run without a device can't be a
	// Daily: `POST /api/runs` refuses it, since NULLs never collide in a unique index
	(table) => [
		uniqueIndex('runs_device_daily_unique')
			.on(table.deviceId, table.dailyDate)
			.where(sql`daily_date IS NOT NULL`)
	]
);

/**
 * The Daily Run's set per UTC day (Sprint 10d): written once, by the day's first request, with an
 * insert that ignores a conflict, so two first requests agree. Publishing a game mid-day doesn't
 * change today's set
 */
export const dailyChallenges = sqliteTable('daily_challenges', {
	// `2026-10-05`, the UTC day
	date: text('date').primaryKey(),
	// #1, #2, …: days since the first Daily, plus one
	number: integer('number').notNull(),
	// A JSON array of game ids: the anchor first, then the 10 cards
	gameIds: text('game_ids').notNull(),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});
