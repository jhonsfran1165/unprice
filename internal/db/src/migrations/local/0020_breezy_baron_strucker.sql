ALTER TYPE "subscription_status" ADD VALUE 'past_due';--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "grace_period" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "start_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "end_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "change_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "cancel_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "billing_cycle_start_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "billing_cycle_end_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "last_change_plan_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "past_due_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "start_date_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "end_date_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "changed_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "cancelled_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "next_billing_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "is_new";