ALTER TABLE "unprice_plan_versions" DROP CONSTRAINT "plan_versions_plan_id_pkey";
--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD CONSTRAINT "plan_versions_plan_id_pkey" FOREIGN KEY ("plan_id","project_id") REFERENCES "public"."unprice_plans"("id","project_id") ON DELETE cascade ON UPDATE no action;