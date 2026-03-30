import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const games = sqliteTable('games', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	slug: text('slug').unique().notNull(),
	year: integer('year').notNull(),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

export const screenshots = sqliteTable('screenshots', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	gameId: integer('game_id')
		.references(() => games.id)
		.notNull(),
	url: text('url').notNull(),
	difficulty: text('difficulty').default('medium'),
	isPrimary: integer('is_primary').default(1),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

export const scores = sqliteTable('scores', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	playerName: text('player_name').notNull(),
	totalScore: integer('total_score').notNull(),
	correctPlacements: integer('correct_placements'),
	wrongPlacements: integer('wrong_placements'),
	bestStreak: integer('best_streak'),
	difficulty: text('difficulty').default('medium'),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});
