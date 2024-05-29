ALTER TABLE "builderai_workspaces" DROP CONSTRAINT "unprice_customer_id";--> statement-breakpoint
ALTER TABLE "builderai_workspaces" ALTER COLUMN "unprice_customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "builderai_workspaces" ADD CONSTRAINT "unprice_customer_id" UNIQUE NULLS NOT DISTINCT("unprice_customer_id");