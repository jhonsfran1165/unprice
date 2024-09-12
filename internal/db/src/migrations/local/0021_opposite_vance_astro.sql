ALTER TYPE "subscription_status" ADD VALUE 'expired';--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "start_cycle" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "billing_cycle_start_at_m" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "billing_cycle_end_at_m" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "next_billing_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "change_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "cancel_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "last_change_plan_at_m";