CREATE TABLE `unpricedo_v1_entitlements` (
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
	`usage` numeric DEFAULT '0',
	`accumulatedUsage` numeric DEFAULT '0',
	`limit` integer,
	`lastUsageUpdateAt` integer NOT NULL,
	`validFrom` integer NOT NULL,
	`validTo` integer NOT NULL,
	`bufferPeriodDays` integer DEFAULT 1 NOT NULL,
	`resetedAt` integer NOT NULL,
	`metadata` text,
	`active` integer DEFAULT 1 NOT NULL,
	`realtime` integer DEFAULT 0 NOT NULL,
	`type` text DEFAULT 'feature' NOT NULL,
	`isCustom` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `entitlements_customer_idx` ON `unpricedo_v1_entitlements` (`customerId`);--> statement-breakpoint
CREATE INDEX `entitlements_feature_idx` ON `unpricedo_v1_entitlements` (`featureSlug`);--> statement-breakpoint
CREATE INDEX `entitlements_project_idx` ON `unpricedo_v1_entitlements` (`projectId`);--> statement-breakpoint
CREATE INDEX `entitlements_valid_from_idx` ON `unpricedo_v1_entitlements` (`validFrom`);--> statement-breakpoint
CREATE INDEX `entitlements_valid_to_idx` ON `unpricedo_v1_entitlements` (`validTo`);--> statement-breakpoint
CREATE INDEX `entitlements_entitlement_id_idx` ON `unpricedo_v1_entitlements` (`entitlementId`);--> statement-breakpoint
CREATE TABLE `unpricedo_v1_usage_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entitlementId` text NOT NULL,
	`idempotenceKey` text NOT NULL,
	`requestId` text NOT NULL,
	`featureSlug` text NOT NULL,
	`customerId` text NOT NULL,
	`projectId` text NOT NULL,
	`featurePlanVersionId` text NOT NULL,
	`subscriptionItemId` text,
	`subscriptionPhaseId` text,
	`subscriptionId` text,
	`timestamp` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`usage` numeric,
	`metadata` text,
	`deleted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `usage_records_customer_idx` ON `unpricedo_v1_usage_records` (`customerId`);--> statement-breakpoint
CREATE INDEX `usage_records_feature_idx` ON `unpricedo_v1_usage_records` (`featureSlug`);--> statement-breakpoint
CREATE INDEX `usage_records_timestamp_idx` ON `unpricedo_v1_usage_records` (`timestamp`);--> statement-breakpoint
CREATE TABLE `unpricedo_v1_verifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`requestId` text NOT NULL,
	`projectId` text NOT NULL,
	`featurePlanVersionId` text NOT NULL,
	`subscriptionItemId` text,
	`subscriptionPhaseId` text,
	`subscriptionId` text,
	`entitlementId` text NOT NULL,
	`deniedReason` text,
	`timestamp` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`latency` numeric,
	`featureSlug` text NOT NULL,
	`customerId` text NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE INDEX `verifications_customer_idx` ON `unpricedo_v1_verifications` (`customerId`);--> statement-breakpoint
CREATE INDEX `verifications_feature_idx` ON `unpricedo_v1_verifications` (`featureSlug`);--> statement-breakpoint
CREATE INDEX `verifications_timestamp_idx` ON `unpricedo_v1_verifications` (`timestamp`);--> statement-breakpoint
CREATE INDEX `verifications_request_id_idx` ON `unpricedo_v1_verifications` (`requestId`);--> statement-breakpoint
CREATE INDEX `verifications_entitlement_idx` ON `unpricedo_v1_verifications` (`entitlementId`);