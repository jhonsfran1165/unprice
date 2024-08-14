ALTER TABLE "unprice_plan_versions_features" ALTER COLUMN "default_quantity" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "when_to_bill" "when_to_bill" DEFAULT 'pay_in_advance';--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "start_cycle" text DEFAULT 'first_day_of_month';--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "grace_period" integer DEFAULT 0;