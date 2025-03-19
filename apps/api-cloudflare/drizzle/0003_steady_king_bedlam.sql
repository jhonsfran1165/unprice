ALTER TABLE `usage_records` RENAME COLUMN "key_id" TO "keyId";--> statement-breakpoint
DROP INDEX `key_id_index`;--> statement-breakpoint
CREATE INDEX `key_id_index` ON `usage_records` (`keyId`);