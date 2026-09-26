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

export const scores = sqliteTable('scores', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	playerName: text('player_name').notNull(),
	totalScore: integer('total_score').notNull(),
	correctPlacements: integer('correct_placements'),
	wrongPlacements: integer('wrong_placements'),
	bestStreak: integer('best_streak'),
	difficulty: text('difficulty').default('normal'),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});
