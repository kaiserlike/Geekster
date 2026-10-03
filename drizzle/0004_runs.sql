CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`mode` text NOT NULL,
	`device_id` text,
	`game_ids` text NOT NULL,
	`position` integer DEFAULT 1 NOT NULL,
	`stage` text DEFAULT 'placing' NOT NULL,
	`lives` integer NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`best_streak` integer DEFAULT 0 NOT NULL,
	`lives_won_back` integer DEFAULT 0 NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL,
	`wrong` integer DEFAULT 0 NOT NULL,
	`bonus_deadline` integer,
	`end_reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`finished_at` text
);
--> statement-breakpoint
ALTER TABLE `scores` ADD `run_id` text;--> statement-breakpoint
ALTER TABLE `scores` ADD `device_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `scores_run_id_unique` ON `scores` (`run_id`);