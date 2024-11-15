ALTER TABLE "unprice_subscriptions" ADD COLUMN "past_dued_at_m" bigint;--> statement-breakpoint
ALTER TABLE "public"."unprice_subscription_phases" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."unprice_subscriptions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."subscription_status" CASCADE;--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('pending', 'active', 'trialing', 'changed', 'canceled', 'expired', 'past_due');--> statement-breakpoint
ALTER TABLE "public"."unprice_subscription_phases" ALTER COLUMN "status" SET DATA TYPE "public"."subscription_status" USING "status"::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "public"."unprice_subscriptions" ALTER COLUMN "status" SET DATA TYPE "public"."subscription_status" USING "status"::"public"."subscription_status";