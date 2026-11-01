CREATE TABLE `ai_memory` (
	`chat_id` integer PRIMARY KEY NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
