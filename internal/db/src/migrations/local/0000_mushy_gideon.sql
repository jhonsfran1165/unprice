DO $$ BEGIN
 CREATE TYPE "public"."aggregation_method" AS ENUM('sum', 'last_during_period', 'count', 'max');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."collection_method" AS ENUM('charge_automatically', 'send_invoice');
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
 CREATE TYPE "public"."start_cycle" AS ENUM('first_day_of_month', 'first_day_of_year', 'last_day_of_month', 'last_day_of_year');
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
 CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'ended', 'cancelled');
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
 CREATE TYPE "public"."feature_version_types" AS ENUM('feature', 'addon');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_type" AS ENUM('plan', 'addons');
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
CREATE TABLE IF NOT EXISTS "unprice_apikeys" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"expires_at_m" bigint,
	"last_used_m" bigint,
	"revoked_at_m" bigint,
	"name" text NOT NULL,
	"key" text NOT NULL,
	CONSTRAINT "pk_apikeys" PRIMARY KEY("id","project_id"),
	CONSTRAINT "name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_account" (
	"userId" varchar(64) NOT NULL,
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
	CONSTRAINT "unprice_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_authenticator" (
	"credentialID" text NOT NULL,
	"userId" varchar(64) NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "unprice_authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID"),
	CONSTRAINT "unprice_authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_session" (
	"sessionToken" varchar(64) PRIMARY KEY NOT NULL,
	"userId" varchar(64) NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_user" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"theme" text DEFAULT 'dark' NOT NULL,
	"default_wk_slug" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_verificationToken" (
	"identifier" varchar(64) NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "unprice_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_customers" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"metadata" json,
	"stripe_customer_id" text,
	"active" boolean DEFAULT true,
	"default_currency" "currency" DEFAULT 'USD' NOT NULL,
	"timezone" varchar(32) DEFAULT 'UTC' NOT NULL,
	CONSTRAINT "pk_customer" PRIMARY KEY("id","project_id"),
	CONSTRAINT "stripe_customer_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "unique_email_project" UNIQUE("email","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_domains" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"apex_name" text NOT NULL,
	"verified" boolean DEFAULT false,
	CONSTRAINT "unprice_domains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_features" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"slug" text NOT NULL,
	"code" serial NOT NULL,
	"title" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "features_pkey" PRIMARY KEY("project_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_ingestions" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"schema" text NOT NULL,
	"hash" text NOT NULL,
	"parent" text,
	"origin" text NOT NULL,
	"apikey_id" varchar(64) NOT NULL,
	CONSTRAINT "ingestions_pkey" PRIMARY KEY("project_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_plan_versions_features" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"plan_version_id" varchar(64) NOT NULL,
	"feature_id" varchar(64) NOT NULL,
	"feature_type" "feature_types" NOT NULL,
	"features_config" json,
	"metadata" json,
	"aggregation_method" "aggregation_method" DEFAULT 'sum' NOT NULL,
	"order" double precision NOT NULL,
	"default_quantity" integer DEFAULT 1,
	"limit" integer,
	"hidden" boolean DEFAULT false NOT NULL,
	CONSTRAINT "plan_versions_pkey" PRIMARY KEY("id","project_id"),
	CONSTRAINT "unique_version_feature" UNIQUE NULLS NOT DISTINCT("plan_version_id","feature_id","project_id","order")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_plan_versions" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"plan_id" varchar(64) NOT NULL,
	"description" text,
	"latest" boolean DEFAULT false,
	"title" varchar(50) NOT NULL,
	"tags" json,
	"active" boolean DEFAULT true,
	"plan_version_status" "plan_version_status" DEFAULT 'draft',
	"published_at_m" bigint,
	"published_by" varchar(64),
	"archived" boolean DEFAULT false,
	"archived_at_m" bigint,
	"archived_by" varchar(64),
	"payment_providers" "payment_providers" NOT NULL,
	"plan_type" "plan_type" DEFAULT 'recurring' NOT NULL,
	"currency" "currency" NOT NULL,
	"billing_period" "billing_period",
	"when_to_bill" "when_to_bill" DEFAULT 'pay_in_advance',
	"start_cycle" "start_cycle" DEFAULT 'first_day_of_month',
	"grace_period" integer DEFAULT 0,
	"metadata" json,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "plan_versions_plan_id_fkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_plans" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true,
	"description" text,
	"metadata" json,
	"default_plan" boolean DEFAULT false,
	"enterprise_plan" boolean DEFAULT false,
	CONSTRAINT "plans_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_projects" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"default_currency" "currency" DEFAULT 'USD' NOT NULL,
	"timezone" varchar(32) DEFAULT 'UTC',
	CONSTRAINT "unique_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_subscription_items" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"units" integer,
	"subscription_id" varchar(64) NOT NULL,
	"feature_plan_version_id" varchar(64) NOT NULL,
	CONSTRAINT "subscription_items_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_subscriptions" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"customers_id" varchar(64) NOT NULL,
	"default_payment_method_id" text,
	"plan_version_id" varchar(64) NOT NULL,
	"type" "subscription_type" DEFAULT 'plan' NOT NULL,
	"prorated" boolean DEFAULT true,
	"when_to_bill" "when_to_bill" DEFAULT 'pay_in_advance' NOT NULL,
	"start_cycle" "start_cycle" DEFAULT 'first_day_of_month' NOT NULL,
	"grace_period" integer DEFAULT 0,
	"timezone" varchar(32) DEFAULT 'UTC' NOT NULL,
	"trial_days" integer DEFAULT 0,
	"trial_ends_at_m" bigint,
	"start_date_at_m" bigint DEFAULT 0 NOT NULL,
	"end_date_at_m" bigint,
	"plan_changed_at_m" bigint,
	"auto_renew" boolean DEFAULT true,
	"collection_method" "collection_method" DEFAULT 'charge_automatically' NOT NULL,
	"is_new" boolean DEFAULT true,
	"status" "subscription_status" DEFAULT 'active',
	"metadata" json,
	"next_plan_version_to" text,
	"next_subscription_id" varchar(64),
	CONSTRAINT "subscriptions_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_invites" (
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"email" text NOT NULL,
	"role" "team_roles" DEFAULT 'MEMBER' NOT NULL,
	"accepted_at_m" bigint,
	CONSTRAINT "invites_pkey" PRIMARY KEY("email","workspace_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_members" (
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"role" "team_roles" DEFAULT 'MEMBER' NOT NULL,
	CONSTRAINT "members_pkey" PRIMARY KEY("user_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_workspaces" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_personal" boolean DEFAULT false,
	"is_internal" boolean DEFAULT false,
	"created_by" varchar(64) NOT NULL,
	"image_url" text,
	"unprice_customer_id" text NOT NULL,
	"legacy_plans" "legacy_plans" DEFAULT 'FREE' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "unprice_workspaces_slug_unique" UNIQUE("slug"),
	CONSTRAINT "unprice_customer_id" UNIQUE("unprice_customer_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_usage" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"subscription_item_id" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"usage" integer NOT NULL,
	"limit" integer,
	CONSTRAINT "usage_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_pages" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"content" text,
	"title" text NOT NULL,
	"custom_domain" text,
	"subdomain" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo" text,
	"font" text,
	"published" boolean DEFAULT false NOT NULL,
	CONSTRAINT "page_pkey" PRIMARY KEY("id","project_id"),
	CONSTRAINT "unprice_pages_custom_domain_unique" UNIQUE("custom_domain"),
	CONSTRAINT "unprice_pages_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_apikeys" ADD CONSTRAINT "unprice_apikeys_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_account" ADD CONSTRAINT "unprice_account_userId_unprice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."unprice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_authenticator" ADD CONSTRAINT "unprice_authenticator_userId_unprice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."unprice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_session" ADD CONSTRAINT "unprice_session_userId_unprice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."unprice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_customers" ADD CONSTRAINT "unprice_customers_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_domains" ADD CONSTRAINT "unprice_domains_workspace_id_unprice_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_features" ADD CONSTRAINT "unprice_features_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_ingestions" ADD CONSTRAINT "unprice_ingestions_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_ingestions" ADD CONSTRAINT "ingestions_apikey_id_fkey" FOREIGN KEY ("apikey_id","project_id") REFERENCES "public"."unprice_apikeys"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_plan_versions_features" ADD CONSTRAINT "unprice_plan_versions_features_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_plan_versions_features" ADD CONSTRAINT "plan_versions_id_fkey" FOREIGN KEY ("plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_plan_versions_features" ADD CONSTRAINT "features_id_fkey" FOREIGN KEY ("feature_id","project_id") REFERENCES "public"."unprice_features"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_plan_versions" ADD CONSTRAINT "unprice_plan_versions_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_plan_versions" ADD CONSTRAINT "unprice_plan_versions_published_by_unprice_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."unprice_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_plan_versions" ADD CONSTRAINT "unprice_plan_versions_archived_by_unprice_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."unprice_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_plan_versions" ADD CONSTRAINT "plan_versions_plan_id_pkey" FOREIGN KEY ("plan_id","project_id") REFERENCES "public"."unprice_plans"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_plans" ADD CONSTRAINT "unprice_plans_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_projects" ADD CONSTRAINT "unprice_projects_workspace_id_unprice_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_items" ADD CONSTRAINT "unprice_subscription_items_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_items" ADD CONSTRAINT "subscription_items_subscription_id_fkey" FOREIGN KEY ("subscription_id","project_id") REFERENCES "public"."unprice_subscriptions"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscription_items" ADD CONSTRAINT "subscription_items_plan_version_id_fkey" FOREIGN KEY ("feature_plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions_features"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscriptions" ADD CONSTRAINT "unprice_subscriptions_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customers_id","project_id") REFERENCES "public"."unprice_customers"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_subscriptions" ADD CONSTRAINT "subscriptions_planversion_id_fkey" FOREIGN KEY ("plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_invites" ADD CONSTRAINT "unprice_invites_workspace_id_unprice_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_members" ADD CONSTRAINT "unprice_members_workspace_id_unprice_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."unprice_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_workspaces" ADD CONSTRAINT "unprice_workspaces_created_by_unprice_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."unprice_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_usage" ADD CONSTRAINT "unprice_usage_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_usage" ADD CONSTRAINT "usage_subitem_fkey" FOREIGN KEY ("subscription_item_id","project_id") REFERENCES "public"."unprice_subscription_items"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_pages" ADD CONSTRAINT "unprice_pages_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "key" ON "unprice_apikeys" USING btree ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email" ON "unprice_customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name" ON "unprice_domains" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "slug_feature" ON "unprice_features" USING btree ("slug","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "slug_plan" ON "unprice_plans" USING btree ("slug","project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slug_index" ON "unprice_projects" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_planversion_subscription" ON "unprice_subscriptions" USING btree ("customers_id","plan_version_id","project_id") WHERE "unprice_subscriptions"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_usage_subitem" ON "unprice_usage" USING btree ("project_id","subscription_item_id","month","year");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "slug_page" ON "unprice_pages" USING btree ("slug","project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subdomain_index" ON "unprice_pages" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_domain_index" ON "unprice_pages" USING btree ("custom_domain");