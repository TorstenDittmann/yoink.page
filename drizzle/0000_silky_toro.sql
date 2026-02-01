CREATE TABLE `conversions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`html_output` text NOT NULL,
	`image_preview` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `usage` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`count` integer DEFAULT 0,
	PRIMARY KEY(`user_id`, `date`)
);
