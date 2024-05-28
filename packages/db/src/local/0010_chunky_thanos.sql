ALTER TABLE "builderai_subscriptions" RENAME COLUMN "payment_method_id" TO "payment_provider_id";--> statement-breakpoint
ALTER TABLE "builderai_subscriptions" DROP CONSTRAINT "subscriptions_payment_method_id_fkey";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_subscriptions" ADD CONSTRAINT "subscriptions_payment_method_id_fkey" FOREIGN KEY ("payment_provider_id","project_id") REFERENCES "public"."builderai_customer_payment_providers"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
