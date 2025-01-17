ALTER TABLE "unprice_invoices" ADD COLUMN "prorated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "last_renew_at_m" bigint;