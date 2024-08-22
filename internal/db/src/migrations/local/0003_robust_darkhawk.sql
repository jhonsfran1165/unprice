ALTER TABLE "unprice_customers" DROP CONSTRAINT "unique_email_project";--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ADD COLUMN "default_currency" "currency" DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ADD COLUMN "timezone" varchar(32) DEFAULT 'UTC' NOT NULL;