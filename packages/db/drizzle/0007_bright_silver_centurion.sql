CREATE TABLE `food_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spot_id` integer NOT NULL,
	`nickname` text NOT NULL,
	`rating` integer NOT NULL,
	`taste` integer,
	`portion` integer,
	`environment` integer,
	`body` text,
	`link_url` text,
	`dishes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_food_reviews_spot` ON `food_reviews` (`spot_id`);--> statement-breakpoint
CREATE TABLE `food_spots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`address` text,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`link_url` text,
	`dishes` text,
	`nickname` text NOT NULL,
	`created_at` text NOT NULL
);
