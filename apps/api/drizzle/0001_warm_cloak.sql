PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_usage_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key_id` text NOT NULL,
	`usage` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_usage_records`("id", "key_id", "usage") SELECT "id", "key_id", "usage" FROM `usage_records`;--> statement-breakpoint
DROP TABLE `usage_records`;--> statement-breakpoint
ALTER TABLE `__new_usage_records` RENAME TO `usage_records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;