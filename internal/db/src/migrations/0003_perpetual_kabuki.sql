ALTER TABLE "unprice_subscriptions" ALTER COLUMN "plan_slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD COLUMN "units" integer;