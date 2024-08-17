ALTER TABLE "unprice_subscriptions" ALTER COLUMN "when_to_bill" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "start_cycle" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "timezone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ADD COLUMN "expires_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ADD COLUMN "last_used_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ADD COLUMN "revoked_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_customers" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customers" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_domains" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_domains" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_features" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_features" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_ingestions" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_ingestions" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD COLUMN "published_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD COLUMN "archived_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_plans" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plans" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_projects" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_projects" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "trial_ends_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "start_date_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "end_date_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "plan_changed_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_invites" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_invites" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_invites" ADD COLUMN "accepted_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_members" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_members" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_usage" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_usage" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_pages" ADD COLUMN "created_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_pages" ADD COLUMN "updated_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_apikeys" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_apikeys" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_apikeys" DROP COLUMN IF EXISTS "expires_at";--> statement-breakpoint
ALTER TABLE "unprice_apikeys" DROP COLUMN IF EXISTS "last_used";--> statement-breakpoint
ALTER TABLE "unprice_apikeys" DROP COLUMN IF EXISTS "revoked_at";--> statement-breakpoint
ALTER TABLE "unprice_customers" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_customers" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_domains" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_domains" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_features" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_features" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_ingestions" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_ingestions" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" DROP COLUMN IF EXISTS "published_at";--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" DROP COLUMN IF EXISTS "archived_at";--> statement-breakpoint
ALTER TABLE "unprice_plans" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_plans" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_projects" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_projects" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "trial_ends";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "start_date";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "end_date";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "plan_changed";--> statement-breakpoint
ALTER TABLE "unprice_invites" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_invites" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_invites" DROP COLUMN IF EXISTS "accepted_at";--> statement-breakpoint
ALTER TABLE "unprice_members" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_members" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_workspaces" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_workspaces" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_usage" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_usage" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "unprice_pages" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "unprice_pages" DROP COLUMN IF EXISTS "updated_at";