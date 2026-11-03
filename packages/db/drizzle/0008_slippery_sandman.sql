ALTER TABLE `site_comments` ADD `tag` text DEFAULT '其他' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_comments` ADD `like_count` integer DEFAULT 0 NOT NULL;