ALTER TABLE "unprice_customer_entitlements" DROP CONSTRAINT "subscription_phase_id_fkey";
--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ALTER COLUMN "end_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ALTER COLUMN "last_updated_at" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD COLUMN "subscription_item_id" varchar(64);--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD COLUMN "units" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "subscription_item_id_fkey" FOREIGN KEY ("subscription_item_id","project_id") REFERENCES "public"."unprice_subscription_items"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" DROP COLUMN IF EXISTS "subscription_phase_id";--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" DROP COLUMN IF EXISTS "quantity";--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" DROP COLUMN IF EXISTS "is_usage";