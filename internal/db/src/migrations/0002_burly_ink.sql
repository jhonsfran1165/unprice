ALTER TABLE "unprice_plans" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "billing_anchor" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "billing_anchor" SET DEFAULT 'dayOfCreation';