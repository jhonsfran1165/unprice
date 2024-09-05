
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "start_cycle" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "start_cycle" SET DATA TYPE integer USING (start_cycle::integer);--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "start_cycle" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "grace_period" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "trial_days" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "auto_renew" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "is_new" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD COLUMN "trial_days" integer DEFAULT 0 NOT NULL;