CREATE TABLE IF NOT EXISTS "builderai_subscription_features" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"quantity" integer,
	"subscription_id" text NOT NULL,
	"feature_plan_id" text NOT NULL,
	"limit" integer,
	"feature_slug" text,
	"usage" integer,
	CONSTRAINT "subscription_features_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_subscription_features" ADD CONSTRAINT "builderai_subscription_features_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_subscription_features" ADD CONSTRAINT "subscription_features_subscription_id_fkey" FOREIGN KEY ("subscription_id","project_id") REFERENCES "public"."builderai_subscriptions"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_subscription_features" ADD CONSTRAINT "subscription_features_plan_id_fkey" FOREIGN KEY ("feature_plan_id","project_id") REFERENCES "public"."builderai_plan_versions_features"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "builderai_plan_versions_features" DROP COLUMN IF EXISTS "type";