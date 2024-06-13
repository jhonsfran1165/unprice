ALTER TABLE "builderai_subscription_items" RENAME COLUMN "quantity" TO "units";--> statement-breakpoint
DROP INDEX IF EXISTS "unique_active_planversion_subscription";--> statement-breakpoint
ALTER TABLE "builderai_subscription_items" ALTER COLUMN "units" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_planversion_subscription" ON "builderai_subscriptions" USING btree ("customers_id","plan_version_id","project_id") WHERE "builderai_subscriptions"."status" = 'active';--> statement-breakpoint
ALTER TABLE "builderai_subscriptions" DROP COLUMN IF EXISTS "active";