--> Corrective rebuild: `created_at` was declared DEFAULT 'CURRENT_TIMESTAMP',
--> a quoted string literal, so every row inserted since stored the eleven
--> characters CURRENT_TIMESTAMP instead of a time. SQLite cannot alter a column
--> default, so each table is rebuilt. Hand-written: `schema.ts` and the stored
--> snapshot have always described the correct default, so `db:generate` sees no
--> diff and will not produce this.
--> The literal values are backfilled to NULL rather than invented — the real
--> creation times are unrecoverable, and the column is already `string | null`.
--> Sequences are carried across so an id is never reused.
CREATE TEMP TABLE `seq_backup` AS SELECT `name`, `seq` FROM `sqlite_sequence`;
--> statement-breakpoint
CREATE TABLE `games_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`year` integer NOT NULL,
	`published` integer DEFAULT 1,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `games_new` (`id`, `name`, `slug`, `year`, `published`, `created_at`)
SELECT `id`, `name`, `slug`, `year`, `published`,
	CASE WHEN `created_at` = 'CURRENT_TIMESTAMP' THEN NULL ELSE `created_at` END
FROM `games`;
--> statement-breakpoint
CREATE TABLE `screenshots_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` integer NOT NULL,
	`url` text NOT NULL,
	`difficulty` text DEFAULT 'medium',
	`is_primary` integer DEFAULT 1,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`game_id`) REFERENCES `games_new`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `screenshots_new` (`id`, `game_id`, `url`, `difficulty`, `is_primary`, `created_at`)
SELECT `id`, `game_id`, `url`, `difficulty`, `is_primary`,
	CASE WHEN `created_at` = 'CURRENT_TIMESTAMP' THEN NULL ELSE `created_at` END
FROM `screenshots`;
--> statement-breakpoint
CREATE TABLE `scores_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_name` text NOT NULL,
	`total_score` integer NOT NULL,
	`correct_placements` integer,
	`wrong_placements` integer,
	`best_streak` integer,
	`difficulty` text DEFAULT 'medium',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `scores_new` (`id`, `player_name`, `total_score`, `correct_placements`, `wrong_placements`, `best_streak`, `difficulty`, `created_at`)
SELECT `id`, `player_name`, `total_score`, `correct_placements`, `wrong_placements`, `best_streak`, `difficulty`,
	CASE WHEN `created_at` = 'CURRENT_TIMESTAMP' THEN NULL ELSE `created_at` END
FROM `scores`;
--> statement-breakpoint
DROP TABLE `screenshots`;
--> statement-breakpoint
DROP TABLE `games`;
--> statement-breakpoint
DROP TABLE `scores`;
--> statement-breakpoint
ALTER TABLE `games_new` RENAME TO `games`;
--> statement-breakpoint
ALTER TABLE `screenshots_new` RENAME TO `screenshots`;
--> statement-breakpoint
ALTER TABLE `scores_new` RENAME TO `scores`;
--> statement-breakpoint
CREATE UNIQUE INDEX `games_slug_unique` ON `games` (`slug`);
--> statement-breakpoint
UPDATE `sqlite_sequence` SET `seq` = (SELECT `seq` FROM `seq_backup` WHERE `seq_backup`.`name` = `sqlite_sequence`.`name`)
WHERE `name` IN (SELECT `name` FROM `seq_backup`);
--> statement-breakpoint
DROP TABLE `seq_backup`;
