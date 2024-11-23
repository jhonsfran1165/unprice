CREATE TYPE "public"."phase_status" AS ENUM('active', 'trialing', 'changed', 'canceled', 'expired', 'past_due', 'trial_ended');--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" ALTER COLUMN "start_at_m" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN IF EXISTS "status" CASCADE;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" DROP COLUMN IF EXISTS "last_updated_at";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "status" CASCADE;--> statement-breakpoint
DROP TYPE "public"."change_type";--> statement-breakpoint
DROP TYPE "public"."change_type_subscription_item";--> statement-breakpoint
DROP TYPE "public"."status_sub_changes";--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" ADD COLUMN "status" phase_status NOT NULL DEFAULT 'active';--> statement-breakpoint
