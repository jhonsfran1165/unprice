ALTER TABLE "unprice_customer_entitlements" ALTER COLUMN "type" SET DATA TYPE feature_version_types;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD COLUMN "subscription_phase_id" varchar(36);--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD COLUMN "subscription_id" varchar(36);--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD COLUMN "current_cycle_start_at" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD COLUMN "current_cycle_end_at" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD COLUMN "grace_period" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "subscription_phase_id_fkey" FOREIGN KEY ("subscription_phase_id","project_id") REFERENCES "public"."unprice_subscription_phases"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "subscription_id_fkey" FOREIGN KEY ("subscription_id","project_id") REFERENCES "public"."unprice_subscriptions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feature_slug_index" ON "unprice_customer_entitlements" USING btree ("feature_slug");--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" DROP COLUMN "units";