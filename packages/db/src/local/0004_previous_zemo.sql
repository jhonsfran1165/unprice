DO $$ BEGIN
 CREATE TYPE "public"."feature_version_types" AS ENUM('feature', 'addon');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "builderai_plan_versions_features" ADD COLUMN "type" "feature_version_types" DEFAULT 'feature' NOT NULL;
--> statement-breakpoint
ALTER TABLE "builderai_plan_versions_features" ALTER COLUMN "type" SET DATA TYPE feature_version_types;