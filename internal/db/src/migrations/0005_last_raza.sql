ALTER TABLE "unprice_subscriptions" ADD COLUMN "locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "locked_at_m" bigint;