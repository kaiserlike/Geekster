CREATE TABLE `share_counts` (
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`method` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`date`, `kind`, `method`)
);
