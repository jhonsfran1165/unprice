ALTER TABLE "builderai_plan_versions_features" DROP CONSTRAINT "features_id_fkey";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_plan_versions_features" ADD CONSTRAINT "features_id_fkey" FOREIGN KEY ("feature_id","project_id") REFERENCES "public"."builderai_features"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
