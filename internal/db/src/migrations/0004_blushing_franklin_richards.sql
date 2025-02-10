ALTER TYPE "public"."aggregation_method" ADD VALUE 'sum_all' BEFORE 'last_during_period';--> statement-breakpoint
ALTER TYPE "public"."aggregation_method" ADD VALUE 'count_all' BEFORE 'max';--> statement-breakpoint
ALTER TYPE "public"."aggregation_method" ADD VALUE 'max_all';--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ALTER COLUMN "is_personal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ALTER COLUMN "is_internal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ALTER COLUMN "is_main" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customer_credits" ADD CONSTRAINT "project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customers" ADD CONSTRAINT "project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE no action ON UPDATE no action;