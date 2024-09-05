
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "start_cycle" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "start_cycle" SET DATA TYPE integer USING (start_cycle::integer);--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "start_cycle" SET DEFAULT 1;