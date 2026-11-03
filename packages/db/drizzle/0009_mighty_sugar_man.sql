CREATE TABLE `wall_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`nickname` text NOT NULL,
	`body` text NOT NULL,
	`tag` text DEFAULT '其他' NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`comment_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_wall_posts_parent` ON `wall_posts` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_wall_posts_tag` ON `wall_posts` (`tag`);--> statement-breakpoint
ALTER TABLE `site_comments` DROP COLUMN `tag`;--> statement-breakpoint
ALTER TABLE `site_comments` DROP COLUMN `like_count`;