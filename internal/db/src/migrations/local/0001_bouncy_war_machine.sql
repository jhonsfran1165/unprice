ALTER TYPE "public"."billing_period" ADD VALUE 'custom';--> statement-breakpoint
ALTER TYPE "public"."billing_period" ADD VALUE 'onetime';--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "billing_period" SET DEFAULT 'month';--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "billing_period" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "start_cycle" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" ADD COLUMN "billing_period" "billing_period" DEFAULT 'month' NOT NULL;