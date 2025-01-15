-- remove the renew_at_m column if it exists
ALTER TABLE "unprice_subscriptions" DROP COLUMN "renew_at_m" CASCADE;
--> statement-breakpoint

-- add the renew_at_m column again
ALTER TABLE "unprice_subscriptions" ADD COLUMN "renew_at_m" bigint DEFAULT 0 NOT NULL;
--> statement-breakpoint