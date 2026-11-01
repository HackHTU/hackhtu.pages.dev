PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_rss_history` (
	`post_guid` text NOT NULL,
	`feed_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	PRIMARY KEY(`feed_id`, `post_guid`)
);
--> statement-breakpoint
INSERT INTO `__new_rss_history`("post_guid", "feed_id", "timestamp") SELECT "post_guid", "feed_id", "timestamp" FROM `rss_history`;--> statement-breakpoint
DROP TABLE `rss_history`;--> statement-breakpoint
ALTER TABLE `__new_rss_history` RENAME TO `rss_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_rss_history_feed` ON `rss_history` (`feed_id`);--> statement-breakpoint
CREATE INDEX `idx_class_reviews_class` ON `class_reviews` (`class_id`);