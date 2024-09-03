ALTER TABLE "unprice_subscriptions" ADD COLUMN "last_billed_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "next_billing_at_m" bigint;