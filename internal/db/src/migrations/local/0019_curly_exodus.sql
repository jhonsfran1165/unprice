ALTER TYPE "subscription_status" ADD VALUE 'changed';--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "changed_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "cancelled_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "plan_changed_at_m";