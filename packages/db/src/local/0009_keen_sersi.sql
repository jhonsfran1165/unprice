ALTER TABLE "builderai_subscriptions" ADD COLUMN "payment_method_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_subscriptions" ADD CONSTRAINT "subscriptions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id","project_id") REFERENCES "public"."builderai_customer_payment_providers"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
