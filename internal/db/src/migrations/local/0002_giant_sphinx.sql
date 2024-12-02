ALTER TABLE "unprice_customer_entitlements" DROP CONSTRAINT "subscription_item_id_fkey";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "subscription_item_id_fkey" FOREIGN KEY ("subscription_item_id","project_id") REFERENCES "public"."unprice_subscription_items"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
