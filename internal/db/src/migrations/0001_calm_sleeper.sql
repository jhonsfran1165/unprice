ALTER TABLE "unprice_customer_entitlements" DROP CONSTRAINT "subscription_phase_id_fkey";
--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ALTER COLUMN "usage" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ALTER COLUMN "usage" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ALTER COLUMN "accumulated_usage" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ALTER COLUMN "accumulated_usage" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ALTER COLUMN "valid_to" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customers" ALTER COLUMN "active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customers" ALTER COLUMN "is_main" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "subscription_phase_id_fkey" FOREIGN KEY ("subscription_phase_id","project_id") REFERENCES "public"."unprice_subscription_phases"("id","project_id") ON DELETE cascade ON UPDATE no action;