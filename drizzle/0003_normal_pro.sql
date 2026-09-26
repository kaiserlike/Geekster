--> Sprint 8: two tiers, Normal and Pro, and a primary screenshot per tier.
--> Hand-written. `db:generate` emits libSQL's ALTER COLUMN, which rewrites no
--> data, and opens with a DROP INDEX for an index that does not exist yet.
--> A table rebuild, as in 0002, is what SQLite actually supports.
-->
--> screenshots: difficulty becomes NOT NULL DEFAULT 'normal'; 'medium' (every
-->   row today) becomes 'normal'. 'hard' would become 'pro' and anything else
-->   'normal' — none exist, the CASE only keeps a stray value from surviving.
-->   Adds source_url and the crop rectangle, all nullable (slice 3 writes them).
-->   Adds a partial unique index: one is_primary = 1 row per (game, difficulty).
--> scores: difficulty DEFAULT 'normal', 'medium' rewritten the same way.
--> games is not touched, so the screenshots → games foreign key stays as is.
--> Sequences are carried across, including one whose table is empty.
CREATE TEMP TABLE `seq_backup` AS SELECT `name`, `seq` FROM `sqlite_sequence`;
--> statement-breakpoint
CREATE TABLE `screenshots_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` integer NOT NULL,
	`url` text NOT NULL,
	`difficulty` text DEFAULT 'normal' NOT NULL,
	`is_primary` integer DEFAULT 1,
	`source_url` text,
	`crop_x` integer,
	`crop_y` integer,
	`crop_width` integer,
	`crop_height` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `screenshots_new` (`id`, `game_id`, `url`, `difficulty`, `is_primary`, `created_at`)
SELECT `id`, `game_id`, `url`,
	CASE WHEN `difficulty` = 'hard' THEN 'pro' ELSE 'normal' END,
	`is_primary`, `created_at`
FROM `screenshots`;
--> statement-breakpoint
CREATE TABLE `scores_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_name` text NOT NULL,
	`total_score` integer NOT NULL,
	`correct_placements` integer,
	`wrong_placements` integer,
	`best_streak` integer,
	`difficulty` text DEFAULT 'normal',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `scores_new` (`id`, `player_name`, `total_score`, `correct_placements`, `wrong_placements`, `best_streak`, `difficulty`, `created_at`)
SELECT `id`, `player_name`, `total_score`, `correct_placements`, `wrong_placements`, `best_streak`,
	CASE WHEN `difficulty` = 'hard' THEN 'pro' ELSE 'normal' END,
	`created_at`
FROM `scores`;
--> statement-breakpoint
DROP TABLE `screenshots`;
--> statement-breakpoint
DROP TABLE `scores`;
--> statement-breakpoint
ALTER TABLE `screenshots_new` RENAME TO `screenshots`;
--> statement-breakpoint
ALTER TABLE `scores_new` RENAME TO `scores`;
--> statement-breakpoint
CREATE UNIQUE INDEX `screenshots_primary_per_difficulty` ON `screenshots` (`game_id`,`difficulty`) WHERE is_primary = 1;
--> statement-breakpoint
UPDATE `sqlite_sequence` SET `seq` = (SELECT `seq` FROM `seq_backup` WHERE `seq_backup`.`name` = `sqlite_sequence`.`name`)
WHERE `name` IN (SELECT `name` FROM `seq_backup`);
--> statement-breakpoint
INSERT INTO `sqlite_sequence` (`name`, `seq`)
SELECT `name`, `seq` FROM `seq_backup`
WHERE `name` IN ('screenshots', 'scores') AND `name` NOT IN (SELECT `name` FROM `sqlite_sequence`);
--> statement-breakpoint
DROP TABLE `seq_backup`;
