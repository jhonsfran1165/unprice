ALTER TABLE `usage_records` RENAME COLUMN "keyId" TO "customerId";--> statement-breakpoint
DROP INDEX `key_id_index`;--> statement-breakpoint
ALTER TABLE `usage_records` ADD `featureSlug` text NOT NULL;--> statement-breakpoint
ALTER TABLE `usage_records` ADD `timestamp` integer NOT NULL;--> statement-breakpoint
CREATE INDEX `customer_id_index` ON `usage_records` (`customerId`);