ALTER TABLE "unprice_plan_versions" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD COLUMN "due_behaviour" "due_behaviour" DEFAULT 'cancel' NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "end_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN "due_behaviour";--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN "when_to_bill";--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN "grace_period";--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN "collection_method";--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN "auto_renew";--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN "billing_interval";--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN "billing_interval_count";--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN "billing_anchor";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "previous_cycle_start_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "previous_cycle_end_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "last_invoice_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "last_renew_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "past_due_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "past_dued_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "cancel_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "canceled_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "expires_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "expired_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "change_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "changed_at_m";