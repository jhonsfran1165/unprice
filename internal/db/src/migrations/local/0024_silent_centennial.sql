DO $$ BEGIN
 CREATE TYPE "public"."change_type" AS ENUM('upgrade', 'downgrade');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."change_type_subscription_item" AS ENUM('add', 'remove', 'update');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status_sub_changes" AS ENUM('pending', 'applied');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "subscription_status" ADD VALUE 'canceled';--> statement-breakpoint
ALTER TYPE "subscription_status" ADD VALUE 'changing';--> statement-breakpoint
ALTER TYPE "subscription_status" ADD VALUE 'canceling';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_subscription_changes" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"subscription_id" varchar(64) NOT NULL,
	"previous_plan_version_id" varchar(64) NOT NULL,
	"new_plan_version_id" varchar(64) NOT NULL,
	"status" "status_sub_changes" DEFAULT 'pending' NOT NULL,
	"change_at_m" bigint NOT NULL,
	"applied_at_m" bigint,
	"change_type" "change_type" NOT NULL,
	CONSTRAINT "subscription_changes_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_subscription_item_changes" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"subscription_change_id" varchar(64) NOT NULL,
	"subscription_item_id" varchar(64),
	"previous_feature_plan_version_id" varchar(64),
	"new_feature_plan_version_id" varchar(64) NOT NULL,
	"change_at_m" bigint NOT NULL,
	"applied_at_m" bigint,
	"change_type" "change_type_subscription_item" NOT NULL,
	"status" "status_sub_changes" DEFAULT 'pending' NOT NULL,
	"previous_units" integer,
	"new_units" integer,
	CONSTRAINT "subscription_item_changes_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
ALTER TABLE "unprice_billing_cycle_invoices" DROP CONSTRAINT "billing_cycle_invoices_subscription_id_fkey";
--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" DROP CONSTRAINT "subscription_items_plan_version_id_fkey";
--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP CONSTRAINT "subscriptions_customer_id_fkey";
--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP CONSTRAINT "subscriptions_planversion_id_fkey";
--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "canceled_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "changed_at_m" bigint;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_changes" ADD CONSTRAINT "unprice_subscription_changes_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_changes" ADD CONSTRAINT "subscription_changes_subscription_id_fkey" FOREIGN KEY ("subscription_id","project_id") REFERENCES "public"."unprice_subscriptions"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_changes" ADD CONSTRAINT "subscription_changes_previous_plan_version_id_fkey" FOREIGN KEY ("previous_plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_changes" ADD CONSTRAINT "subscription_changes_new_plan_version_id_fkey" FOREIGN KEY ("new_plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_changes" ADD CONSTRAINT "subscription_changes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_item_changes" ADD CONSTRAINT "unprice_subscription_item_changes_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_item_changes" ADD CONSTRAINT "subscription_item_changes_subscription_change_id_fkey" FOREIGN KEY ("subscription_change_id","project_id") REFERENCES "public"."unprice_subscription_changes"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_item_changes" ADD CONSTRAINT "subscription_item_changes_subscription_item_id_fkey" FOREIGN KEY ("subscription_item_id","project_id") REFERENCES "public"."unprice_subscription_items"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_item_changes" ADD CONSTRAINT "subscription_item_changes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_subscription_change" ON "unprice_subscription_changes" USING btree ("subscription_id","project_id") WHERE "unprice_subscription_changes"."status" = 'pending';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_billing_cycle_invoices" ADD CONSTRAINT "billing_cycle_invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_billing_cycle_invoices" ADD CONSTRAINT "billing_cycle_invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id","project_id") REFERENCES "public"."unprice_subscriptions"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_items" ADD CONSTRAINT "subscription_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_items" ADD CONSTRAINT "subscription_items_plan_version_id_fkey" FOREIGN KEY ("feature_plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions_features"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscriptions" ADD CONSTRAINT "subscriptions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customers_id","project_id") REFERENCES "public"."unprice_customers"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscriptions" ADD CONSTRAINT "subscriptions_planversion_id_fkey" FOREIGN KEY ("plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "next_plan_version_id";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "next_subscription_id";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "last_change_plan_at_m";