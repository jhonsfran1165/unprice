PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_unprice_do_v1_entitlements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entitlementId` text NOT NULL,
	`customerId` text NOT NULL,
	`projectId` text NOT NULL,
	`subscriptionId` text NOT NULL,
	`subscriptionPhaseId` text,
	`subscriptionItemId` text,
	`planVersionFeatureId` text NOT NULL,
	`featureSlug` text NOT NULL,
	`usage` numeric DEFAULT '0',
	`accumulatedUsage` numeric DEFAULT '0',
	`limit` integer,
	`featureType` text NOT NULL,
	`aggregationMethod` text NOT NULL,
	`lastUsageUpdateAt` integer NOT NULL,
	`validFrom` integer NOT NULL,
	`validTo` integer NOT NULL,
	`bufferPeriodDays` integer DEFAULT 1 NOT NULL,
	`resetedAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_unprice_do_v1_entitlements`("id", "entitlementId", "customerId", "projectId", "subscriptionId", "subscriptionPhaseId", "subscriptionItemId", "planVersionFeatureId", "featureSlug", "usage", "accumulatedUsage", "limit", "featureType", "aggregationMethod", "lastUsageUpdateAt", "validFrom", "validTo", "bufferPeriodDays", "resetedAt") SELECT "id", "entitlementId", "customerId", "projectId", "subscriptionId", "subscriptionPhaseId", "subscriptionItemId", "planVersionFeatureId", "featureSlug", "usage", "accumulatedUsage", "limit", "featureType", "aggregationMethod", "lastUsageUpdateAt", "validFrom", "validTo", "bufferPeriodDays", "resetedAt" FROM `unprice_do_v1_entitlements`;--> statement-breakpoint
DROP TABLE `unprice_do_v1_entitlements`;--> statement-breakpoint
ALTER TABLE `__new_unprice_do_v1_entitlements` RENAME TO `unprice_do_v1_entitlements`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `entitlements_customer_idx` ON `unprice_do_v1_entitlements` (`customerId`);--> statement-breakpoint
CREATE INDEX `entitlements_feature_idx` ON `unprice_do_v1_entitlements` (`featureSlug`);--> statement-breakpoint
CREATE INDEX `entitlements_project_idx` ON `unprice_do_v1_entitlements` (`projectId`);--> statement-breakpoint
CREATE INDEX `entitlements_valid_from_idx` ON `unprice_do_v1_entitlements` (`validFrom`);--> statement-breakpoint
CREATE INDEX `entitlements_valid_to_idx` ON `unprice_do_v1_entitlements` (`validTo`);--> statement-breakpoint
CREATE INDEX `entitlements_entitlement_id_idx` ON `unprice_do_v1_entitlements` (`entitlementId`);