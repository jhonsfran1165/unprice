ALTER TABLE "builderai_subscription_features" DROP CONSTRAINT "subscription_features_subscription_id_fkey";
--> statement-breakpoint
ALTER TABLE "builderai_subscription_features" ALTER COLUMN "feature_slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "builderai_subscription_features" ADD COLUMN "min" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_subscription_features" ADD CONSTRAINT "subscription_features_subscription_id_fkey" FOREIGN KEY ("subscription_id","project_id") REFERENCES "public"."builderai_subscriptions"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
