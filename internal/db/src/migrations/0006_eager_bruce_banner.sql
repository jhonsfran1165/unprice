ALTER TABLE "unprice_subscription_phases" ADD COLUMN "last_renew_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" ADD COLUMN "last_invoice_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "previous_cycle_start_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "previous_cycle_end_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "invoice_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN "next_invoice_at_m";