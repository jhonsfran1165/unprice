ALTER TABLE "builderai_workspaces" DROP CONSTRAINT "unprice_customer_id";--> statement-breakpoint
ALTER TABLE "builderai_workspaces" ADD COLUMN "unprice_customer_id" text;--> statement-breakpoint
ALTER TABLE "builderai_workspaces" ADD CONSTRAINT "unprice_customer_id" UNIQUE NULLS NOT DISTINCT("unprice_customer_id");