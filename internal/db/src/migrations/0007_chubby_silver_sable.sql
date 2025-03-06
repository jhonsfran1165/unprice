ALTER TABLE "unprice_subscriptions" ADD COLUMN "last_renew_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "last_invoice_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN "last_renew_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" DROP COLUMN "last_invoice_at_m";