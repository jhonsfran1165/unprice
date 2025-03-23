PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_unprice_do_v1_usage_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entitlementId` text NOT NULL,
	`idempotenceKey` text NOT NULL,
	`requestId` text NOT NULL,
	`featureSlug` text NOT NULL,
	`customerId` text NOT NULL,
	`projectId` text NOT NULL,
	`planVersionFeatureId` text NOT NULL,
	`subscriptionItemId` text,
	`subscriptionPhaseId` text,
	`subscriptionId` text,
	`timestamp` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`usage` numeric,
	`metadata` text,
	`deleted` text DEFAULT '0' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_unprice_do_v1_usage_records`("id", "entitlementId", "idempotenceKey", "requestId", "featureSlug", "customerId", "projectId", "planVersionFeatureId", "subscriptionItemId", "subscriptionPhaseId", "subscriptionId", "timestamp", "createdAt", "usage", "metadata", "deleted") SELECT "id", "entitlementId", "idempotenceKey", "requestId", "featureSlug", "customerId", "projectId", "planVersionFeatureId", "subscriptionItemId", "subscriptionPhaseId", "subscriptionId", "timestamp", "createdAt", "usage", "metadata", "deleted" FROM `unprice_do_v1_usage_records`;--> statement-breakpoint
DROP TABLE `unprice_do_v1_usage_records`;--> statement-breakpoint
ALTER TABLE `__new_unprice_do_v1_usage_records` RENAME TO `unprice_do_v1_usage_records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `usage_records_customer_idx` ON `unprice_do_v1_usage_records` (`customerId`);--> statement-breakpoint
CREATE INDEX `usage_records_feature_idx` ON `unprice_do_v1_usage_records` (`featureSlug`);--> statement-breakpoint
CREATE INDEX `usage_records_timestamp_idx` ON `unprice_do_v1_usage_records` (`timestamp`);