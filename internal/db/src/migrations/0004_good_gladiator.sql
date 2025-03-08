ALTER TYPE "public"."subscription_status" ADD VALUE 'idle' BEFORE 'renewing';--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "billing_config" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "grace_period" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ADD COLUMN "subscription_id" varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" ADD COLUMN "billing_anchor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ADD CONSTRAINT "subscription_items_subscription_id_fkey" FOREIGN KEY ("subscription_id","project_id") REFERENCES "public"."unprice_subscriptions"("id","project_id") ON DELETE cascade ON UPDATE no action;