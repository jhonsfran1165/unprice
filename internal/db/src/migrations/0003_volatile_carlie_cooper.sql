ALTER TABLE "unprice_plan_versions" ADD COLUMN "billing_config" json;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" DROP COLUMN "plan_type";--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" DROP COLUMN "billing_interval";--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" DROP COLUMN "billing_interval_count";--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" DROP COLUMN "billing_anchor";