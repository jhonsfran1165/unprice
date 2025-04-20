ALTER TABLE `unpricedo_v1_entitlements` ADD `active` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `unpricedo_v1_entitlements` ADD `realtime` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `unpricedo_v1_entitlements` ADD `type` text DEFAULT 'feature' NOT NULL;--> statement-breakpoint
ALTER TABLE `unpricedo_v1_entitlements` ADD `isCustom` integer DEFAULT 0 NOT NULL;