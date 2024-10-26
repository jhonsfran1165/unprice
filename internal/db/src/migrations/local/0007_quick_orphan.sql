ALTER TABLE "unprice_invoices" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "expires_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "expired_at_m" bigint;