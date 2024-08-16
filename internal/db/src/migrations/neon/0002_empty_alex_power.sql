DO $$ BEGIN
 CREATE TYPE "public"."start_cycle" AS ENUM('first_day_of_month', 'first_day_of_year', 'last_day_of_month', 'last_day_of_year');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_account" ALTER COLUMN "userId" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_authenticator" ALTER COLUMN "userId" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_session" ALTER COLUMN "sessionToken" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_session" ALTER COLUMN "userId" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_user" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_verificationToken" ALTER COLUMN "identifier" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_verificationToken" ALTER COLUMN "token" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_customers" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_customers" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_customers" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_customers" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_domains" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_domains" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_domains" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_domains" ALTER COLUMN "workspace_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_features" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_features" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_features" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_features" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_ingestions" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_ingestions" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_ingestions" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_ingestions" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_ingestions" ALTER COLUMN "apikey_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ALTER COLUMN "plan_version_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ALTER COLUMN "feature_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ALTER COLUMN "default_quantity" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "plan_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "published_by" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "archived_by" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" DROP COLUMN start_cycle;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD COLUMN start_cycle start_cycle;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "start_cycle" SET DEFAULT 'first_day_of_month';--> statement-breakpoint
ALTER TABLE "unprice_plans" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plans" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_plans" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_plans" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_projects" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_projects" ALTER COLUMN "workspace_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_projects" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_projects" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ALTER COLUMN "subscription_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ALTER COLUMN "feature_plan_version_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "customers_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "plan_version_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "trial_ends" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "start_date" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "end_date" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "plan_changed" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "next_subscription_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_invites" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_invites" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_invites" ALTER COLUMN "workspace_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_members" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_members" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_members" ALTER COLUMN "workspace_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_members" ALTER COLUMN "user_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ALTER COLUMN "created_by" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_usage" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_usage" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_usage" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_usage" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_pages" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_pages" ALTER COLUMN "project_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_pages" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_pages" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "unprice_customers" ADD COLUMN "timezone" varchar(32) DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_projects" ADD COLUMN "timezone" varchar(32) DEFAULT 'UTC';--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN start_cycle;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN start_cycle start_cycle;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "start_cycle" SET DEFAULT 'first_day_of_month';--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "timezone" varchar(32) DEFAULT 'UTC';