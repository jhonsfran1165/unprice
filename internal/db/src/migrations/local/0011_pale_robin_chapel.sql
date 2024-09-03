ALTER TABLE "unprice_plan_versions" ALTER COLUMN "start_cycle" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "start_cycle" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "start_cycle" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "grace_period" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "start_cycle" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "start_cycle" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "start_cycle" DROP NOT NULL;