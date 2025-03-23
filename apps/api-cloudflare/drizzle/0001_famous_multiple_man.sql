ALTER TABLE `unprice_do_v1_entitlements` ADD `entitlementId` text NOT NULL;--> statement-breakpoint
CREATE INDEX `entitlements_entitlement_id_idx` ON `unprice_do_v1_entitlements` (`entitlementId`);