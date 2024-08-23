DROP TABLE "unprice_usage";--> statement-breakpoint
ALTER TABLE "unprice_customers" DROP CONSTRAINT "unique_email_project";--> statement-breakpoint
DROP INDEX IF EXISTS "key";--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "when_to_bill" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "start_cycle" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "grace_period" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ADD COLUMN "hash" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD COLUMN "collection_method" "collection_method" DEFAULT 'charge_automatically' NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ADD COLUMN "default_currency" "currency" DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ADD COLUMN "timezone" varchar(32) DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hash" ON "unprice_apikeys" USING btree ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "key" ON "unprice_apikeys" USING btree ("key");--> statement-breakpoint
ALTER TABLE "unprice_workspaces" DROP COLUMN IF EXISTS "legacy_plans";