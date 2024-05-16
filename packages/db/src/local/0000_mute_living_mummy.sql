DO $$ BEGIN
 CREATE TYPE "public"."aggregation_method" AS ENUM('sum', 'last_during_period', 'last_ever', 'max');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."currency" AS ENUM('USD', 'EUR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_providers" AS ENUM('stripe', 'lemonsqueezy');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."billing_period" AS ENUM('month', 'year');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."plan_type" AS ENUM('recurring');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."legacy_plans" AS ENUM('FREE', 'PRO', 'ENTERPRISE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."project_tier" AS ENUM('FREE', 'PRO', 'ENTERPRISE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."app_stages" AS ENUM('prod', 'test', 'dev');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."plan_version_status" AS ENUM('draft', 'published');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."team_roles" AS ENUM('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tier_mode" AS ENUM('volume', 'graduated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."feature_types" AS ENUM('flat', 'tier', 'package', 'usage');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."usage_mode" AS ENUM('tier', 'package', 'unit');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."when_to_bill" AS ENUM('pay_in_advance', 'pay_in_arrear');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_apikeys" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"last_used" timestamp,
	"revoked_at" timestamp,
	"name" text NOT NULL,
	"key" text NOT NULL,
	CONSTRAINT "pk_apikeys" PRIMARY KEY("id","project_id"),
	CONSTRAINT "name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "builderai_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"theme" text DEFAULT 'dark' NOT NULL,
	"default_wk_slug" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "builderai_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_customers" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"metadata" json,
	CONSTRAINT "pk_customer" PRIMARY KEY("id","project_id"),
	CONSTRAINT "unique_email_project" UNIQUE("email","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_domains" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"apex_name" text NOT NULL,
	"verified" boolean DEFAULT false,
	CONSTRAINT "builderai_domains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_features" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"slug" text NOT NULL,
	"code" serial NOT NULL,
	"title" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "features_pkey" PRIMARY KEY("project_id","id"),
	CONSTRAINT "slug_feature" UNIQUE("slug","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_ingestions" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"schema" text NOT NULL,
	"hash" text NOT NULL,
	"parent" text,
	"origin" text NOT NULL,
	"apikey_id" text NOT NULL,
	CONSTRAINT "ingestions_pkey" PRIMARY KEY("project_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_plan_versions_features" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"plan_version_id" text NOT NULL,
	"feature_id" text NOT NULL,
	"feature_type" "feature_types" NOT NULL,
	"features_config" json,
	"metadata" json,
	"order" double precision NOT NULL,
	CONSTRAINT "plan_versions_pkey" PRIMARY KEY("id","project_id"),
	CONSTRAINT "unique_version_feature" UNIQUE NULLS NOT DISTINCT("plan_version_id","feature_id","project_id","order")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_plan_versions" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"plan_id" text NOT NULL,
	"description" text,
	"latest" boolean DEFAULT false,
	"title" varchar(50) NOT NULL,
	"tags" json,
	"active" boolean DEFAULT true,
	"plan_version_status" "plan_version_status" DEFAULT 'draft',
	"published_at" timestamp,
	"published_by" text,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"archived_by" text,
	"payment_providers" "payment_providers" NOT NULL,
	"plan_type" "plan_type" DEFAULT 'recurring' NOT NULL,
	"currency" "currency" NOT NULL,
	"when_to_bill" "when_to_bill" DEFAULT 'pay_in_advance',
	"billing_period" "billing_period",
	"start_cycle" text DEFAULT null,
	"grace_period" integer DEFAULT 0,
	"metadata" json,
	CONSTRAINT "plan_versions_plan_id_fkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_plans" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true,
	"description" text,
	"metadata" json,
	"default_plan" boolean DEFAULT false,
	CONSTRAINT "plans_pkey" PRIMARY KEY("id","project_id"),
	CONSTRAINT "slug_plan" UNIQUE("slug","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tier" "project_tier" DEFAULT 'FREE' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"stripe_account_id" text DEFAULT '',
	"stripe_account_verified" boolean DEFAULT false,
	CONSTRAINT "unique_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_subscriptions" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"customers_id" text NOT NULL,
	"plan_version_id" text NOT NULL,
	"trial_ends" date,
	"trial_days" integer DEFAULT 0,
	"start_date" date,
	"end_date" date,
	"auto_renew" boolean DEFAULT true,
	"collection_method" text DEFAULT 'charge_automatically',
	"is_new" boolean DEFAULT true,
	"metadata" json DEFAULT '{}'::json,
	"status" "subscription_status" DEFAULT 'active',
	"items" json,
	CONSTRAINT "subscriptions_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_invites" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "team_roles" DEFAULT 'MEMBER' NOT NULL,
	"accepted_at" timestamp,
	CONSTRAINT "invites_pkey" PRIMARY KEY("email","workspace_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_members" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "team_roles" DEFAULT 'MEMBER' NOT NULL,
	CONSTRAINT "members_pkey" PRIMARY KEY("user_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builderai_workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_personal" boolean DEFAULT false,
	"created_by" text NOT NULL,
	"image_url" text,
	"stripe_id" text,
	"subscription_id" text,
	"trial_ends" timestamp,
	"billing_period_start" timestamp,
	"billing_period_end" timestamp,
	"legacy_plans" "legacy_plans" DEFAULT 'FREE' NOT NULL,
	CONSTRAINT "builderai_workspaces_slug_unique" UNIQUE("slug"),
	CONSTRAINT "builderai_workspaces_stripe_id_unique" UNIQUE("stripe_id"),
	CONSTRAINT "builderai_workspaces_subscription_id_unique" UNIQUE("subscription_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_apikeys" ADD CONSTRAINT "builderai_apikeys_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_account" ADD CONSTRAINT "builderai_account_userId_builderai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."builderai_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_session" ADD CONSTRAINT "builderai_session_userId_builderai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."builderai_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_customers" ADD CONSTRAINT "builderai_customers_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_domains" ADD CONSTRAINT "builderai_domains_workspace_id_builderai_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."builderai_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_features" ADD CONSTRAINT "builderai_features_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_ingestions" ADD CONSTRAINT "builderai_ingestions_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_ingestions" ADD CONSTRAINT "ingestions_apikey_id_fkey" FOREIGN KEY ("apikey_id","project_id") REFERENCES "public"."builderai_apikeys"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_plan_versions_features" ADD CONSTRAINT "builderai_plan_versions_features_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_plan_versions_features" ADD CONSTRAINT "plan_versions_id_fkey" FOREIGN KEY ("plan_version_id","project_id") REFERENCES "public"."builderai_plan_versions"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_plan_versions_features" ADD CONSTRAINT "features_id_fkey" FOREIGN KEY ("feature_id","project_id") REFERENCES "public"."builderai_features"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_plan_versions" ADD CONSTRAINT "builderai_plan_versions_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_plan_versions" ADD CONSTRAINT "builderai_plan_versions_published_by_builderai_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."builderai_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_plan_versions" ADD CONSTRAINT "builderai_plan_versions_archived_by_builderai_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."builderai_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_plan_versions" ADD CONSTRAINT "plan_versions_plan_id_pkey" FOREIGN KEY ("plan_id","project_id") REFERENCES "public"."builderai_plans"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_plans" ADD CONSTRAINT "builderai_plans_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_projects" ADD CONSTRAINT "builderai_projects_workspace_id_builderai_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."builderai_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_subscriptions" ADD CONSTRAINT "builderai_subscriptions_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customers_id","project_id") REFERENCES "public"."builderai_customers"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_subscriptions" ADD CONSTRAINT "subscriptions_planversion_id_fkey" FOREIGN KEY ("plan_version_id","project_id") REFERENCES "public"."builderai_plan_versions"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_invites" ADD CONSTRAINT "builderai_invites_workspace_id_builderai_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."builderai_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_members" ADD CONSTRAINT "builderai_members_workspace_id_builderai_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."builderai_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."builderai_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_workspaces" ADD CONSTRAINT "builderai_workspaces_created_by_builderai_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."builderai_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "key" ON "builderai_apikeys" ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email" ON "builderai_customers" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name" ON "builderai_domains" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slug_index" ON "builderai_projects" ("slug");--> statement-breakpoint