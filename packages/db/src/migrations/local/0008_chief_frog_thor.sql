ALTER TABLE "builderai_subscriptions" RENAME COLUMN "payment_provider_id" TO "default_payment_method_id";--> statement-breakpoint
--> statement-breakpoint
DROP INDEX IF EXISTS "key";--> statement-breakpoint
DROP INDEX IF EXISTS "email";--> statement-breakpoint
DROP INDEX IF EXISTS "name";--> statement-breakpoint
DROP INDEX IF EXISTS "slug_index";--> statement-breakpoint
DROP INDEX IF EXISTS "unique_active_planversion_subscription";--> statement-breakpoint
ALTER TABLE "builderai_subscriptions" ALTER COLUMN "default_payment_method_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "builderai_customers" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "key" ON "builderai_apikeys" USING btree (key);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email" ON "builderai_customers" USING btree (email);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name" ON "builderai_domains" USING btree (name);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slug_index" ON "builderai_projects" USING btree (slug);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_planversion_subscription" ON "builderai_subscriptions" USING btree (customers_id,plan_version_id,project_id) WHERE "builderai_subscriptions"."status" = 'active';--> statement-breakpoint
ALTER TABLE "builderai_customers" ADD CONSTRAINT "stripe_customer_unique" UNIQUE ("stripe_customer_id");