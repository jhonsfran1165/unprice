ALTER TABLE "builderai_workspaces" DROP CONSTRAINT "builderai_workspaces_stripe_id_unique";--> statement-breakpoint
ALTER TABLE "builderai_workspaces" DROP CONSTRAINT "builderai_workspaces_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "builderai_workspaces" ADD COLUMN "enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "builderai_workspaces" ADD CONSTRAINT "unprice_customer_id" UNIQUE NULLS NOT DISTINCT("stripe_id");--> statement-breakpoint
ALTER TABLE "builderai_workspaces" ADD CONSTRAINT "stripe_id" UNIQUE NULLS NOT DISTINCT("stripe_id");--> statement-breakpoint
ALTER TABLE "builderai_workspaces" ADD CONSTRAINT "subscription_id" UNIQUE NULLS NOT DISTINCT("subscription_id");