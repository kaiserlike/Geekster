CREATE TABLE `daily_challenges` (
	`date` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`game_ids` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `runs` ADD `daily_date` text;--> statement-breakpoint
ALTER TABLE `runs` ADD `marks` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `runs_device_daily_unique` ON `runs` (`device_id`,`daily_date`) WHERE daily_date IS NOT NULL;--> statement-breakpoint
ALTER TABLE `scores` ADD `daily_date` text;