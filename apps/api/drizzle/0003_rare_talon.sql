PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_unpricedo_v1_entitlements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entitlementId` text NOT NULL,
	`customerId` text NOT NULL,
	`projectId` text NOT NULL,
	`subscriptionId` text NOT NULL,
	`subscriptionPhaseId` text,
	`subscriptionItemId` text,
	`featurePlanVersionId` text NOT NULL,
	`featureSlug` text NOT NULL,
	`featureType` text NOT NULL,
	`aggregationMethod` text NOT NULL,
	`usage` numeric DEFAULT '0' NOT NULL,
	`accumulatedUsage` numeric DEFAULT '0' NOT NULL,
	`limit` integer,
	`lastUsageUpdateAt` integer NOT NULL,
	`validFrom` integer NOT NULL,
	`validTo` integer,
	`bufferPeriodDays` integer DEFAULT 1 NOT NULL,
	`resetedAt` integer NOT NULL,
	`metadata` text,
	`active` integer DEFAULT 1 NOT NULL,
	`realtime` integer DEFAULT 0 NOT NULL,
	`type` text DEFAULT 'feature' NOT NULL,
	`isCustom` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_unpricedo_v1_entitlements`("id", "entitlementId", "customerId", "projectId", "subscriptionId", "subscriptionPhaseId", "subscriptionItemId", "featurePlanVersionId", "featureSlug", "featureType", "aggregationMethod", "usage", "accumulatedUsage", "limit", "lastUsageUpdateAt", "validFrom", "validTo", "bufferPeriodDays", "resetedAt", "metadata", "active", "realtime", "type", "isCustom") SELECT "id", "entitlementId", "customerId", "projectId", "subscriptionId", "subscriptionPhaseId", "subscriptionItemId", "featurePlanVersionId", "featureSlug", "featureType", "aggregationMethod", "usage", "accumulatedUsage", "limit", "lastUsageUpdateAt", "validFrom", "validTo", "bufferPeriodDays", "resetedAt", "metadata", "active", "realtime", "type", "isCustom" FROM `unpricedo_v1_entitlements`;--> statement-breakpoint
DROP TABLE `unpricedo_v1_entitlements`;--> statement-breakpoint
ALTER TABLE `__new_unpricedo_v1_entitlements` RENAME TO `unpricedo_v1_entitlements`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `entitlements_customer_idx` ON `unpricedo_v1_entitlements` (`customerId`);--> statement-breakpoint
CREATE INDEX `entitlements_feature_idx` ON `unpricedo_v1_entitlements` (`featureSlug`);--> statement-breakpoint
CREATE INDEX `entitlements_project_idx` ON `unpricedo_v1_entitlements` (`projectId`);--> statement-breakpoint
CREATE INDEX `entitlements_valid_from_idx` ON `unpricedo_v1_entitlements` (`validFrom`);--> statement-breakpoint
CREATE INDEX `entitlements_valid_to_idx` ON `unpricedo_v1_entitlements` (`validTo`);--> statement-breakpoint
CREATE UNIQUE INDEX `entitlements_entitlement_id_idx` ON `unpricedo_v1_entitlements` (`entitlementId`);