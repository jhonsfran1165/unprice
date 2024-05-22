ALTER TABLE "builderai_workspaces" DROP CONSTRAINT "unprice_customer_id";--> statement-breakpoint
ALTER TABLE "builderai_subscriptions" ADD COLUMN "type" "subscription_type" DEFAULT 'plan' NOT NULL;--> statement-breakpoint
ALTER TABLE "builderai_workspaces" ADD CONSTRAINT "unprice_customer_id" UNIQUE("unprice_customer_id");