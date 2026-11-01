CREATE TABLE `moderation_strikes` (
	`chat_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`strikes` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`chat_id`, `user_id`)
);
