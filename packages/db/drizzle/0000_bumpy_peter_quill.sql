CREATE TABLE `ai_context` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`tokens` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ai_context_chat` ON `ai_context` (`chat_id`,`id`);--> statement-breakpoint
CREATE TABLE `ai_summary` (
	`chat_id` integer PRIMARY KEY NOT NULL,
	`summary` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bot_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `class_info` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`term` text NOT NULL,
	`name` text NOT NULL,
	`credits` integer,
	`hours` integer,
	`category` text NOT NULL,
	`method` text NOT NULL,
	`course_no` text,
	`teacher_name` text,
	`likes` integer DEFAULT 0,
	`dislikes` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `class_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`class_id` integer NOT NULL,
	`reviewed_at` text NOT NULL,
	`attitude` integer NOT NULL,
	`comment` text
);
--> statement-breakpoint
CREATE TABLE `rss_history` (
	`post_guid` text PRIMARY KEY NOT NULL,
	`feed_id` text NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rss_history_feed` ON `rss_history` (`feed_id`);--> statement-breakpoint
CREATE TABLE `site_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nickname` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`token` text PRIMARY KEY NOT NULL,
	`chat_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`question_id` text NOT NULL,
	`answer_index` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`resolved_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_verifications_user` ON `verifications` (`chat_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_verifications_expiry` ON `verifications` (`expires_at`);