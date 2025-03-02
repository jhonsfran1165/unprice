CREATE TYPE "public"."aggregation_method" AS ENUM('sum', 'sum_all', 'last_during_period', 'count', 'count_all', 'max', 'max_all');--> statement-breakpoint
CREATE TYPE "public"."billing_interval" AS ENUM('month', 'year', 'day', 'minute', 'onetime');--> statement-breakpoint
CREATE TYPE "public"."collection_method" AS ENUM('charge_automatically', 'send_invoice');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('USD', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."due_behaviour" AS ENUM('cancel', 'downgrade');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('unpaid', 'paid', 'waiting', 'void', 'draft', 'failed');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('flat', 'usage', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."payment_providers" AS ENUM('stripe', 'lemonsqueezy');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('recurring', 'onetime');--> statement-breakpoint
CREATE TYPE "public"."app_stages" AS ENUM('prod', 'test', 'dev');--> statement-breakpoint
CREATE TYPE "public"."plan_version_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('renewing', 'changing', 'canceling', 'expiring', 'invoicing', 'invoiced', 'ending_trial', 'active', 'trialing', 'canceled', 'expired', 'past_due');--> statement-breakpoint
CREATE TYPE "public"."team_roles" AS ENUM('OWNER', 'ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."tier_mode" AS ENUM('volume', 'graduated');--> statement-breakpoint
CREATE TYPE "public"."feature_types" AS ENUM('flat', 'tier', 'package', 'usage');--> statement-breakpoint
CREATE TYPE "public"."feature_version_types" AS ENUM('feature', 'addon');--> statement-breakpoint
CREATE TYPE "public"."usage_mode" AS ENUM('tier', 'package', 'unit');--> statement-breakpoint
CREATE TYPE "public"."when_to_bill" AS ENUM('pay_in_advance', 'pay_in_arrear');--> statement-breakpoint
CREATE TABLE "unprice_apikeys" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"expires_at_m" bigint,
	"last_used_m" bigint,
	"revoked_at_m" bigint,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"hash" text DEFAULT '' NOT NULL,
	CONSTRAINT "pk_apikeys" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_account" (
	"userId" varchar(36) NOT NULL,
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
CREATE TABLE "unprice_authenticator" (
	"credentialID" text NOT NULL,
	"userId" varchar(36) NOT NULL,
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
CREATE TABLE "unprice_session" (
	"sessionToken" varchar(36) PRIMARY KEY NOT NULL,
	"userId" varchar(36) NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unprice_user" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"theme" text DEFAULT 'dark' NOT NULL,
	"default_wk_slug" text
);
--> statement-breakpoint
CREATE TABLE "unprice_verificationToken" (
	"identifier" varchar(36) NOT NULL,
	"token" varchar(36) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "unprice_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "unprice_customer_credits" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"metadata" json,
	"customer_id" varchar(36) NOT NULL,
	"amount_used" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "customer_credits_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_customer_entitlements" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"subscription_item_id" varchar(36),
	"feature_plan_version_id" varchar(36) NOT NULL,
	"units" integer,
	"limit" integer,
	"usage" integer,
	"feature_slug" text NOT NULL,
	"feature_type" "feature_types" NOT NULL,
	"aggregation_method" "aggregation_method" DEFAULT 'sum' NOT NULL,
	"realtime" boolean DEFAULT false NOT NULL,
	"type" text DEFAULT 'feature' NOT NULL,
	"start_at" bigint NOT NULL,
	"end_at" bigint,
	"is_custom" boolean DEFAULT false NOT NULL,
	"last_usage_update_at" bigint DEFAULT 0 NOT NULL,
	"metadata" json,
	CONSTRAINT "pk_customer_entitlement" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_customer_sessions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"customer" json NOT NULL,
	"plan_version" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unprice_customers" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"metadata" json,
	"stripe_customer_id" text,
	"active" boolean DEFAULT true,
	"is_main" boolean DEFAULT false,
	"default_currency" "currency" DEFAULT 'USD' NOT NULL,
	"timezone" varchar(32) DEFAULT 'UTC' NOT NULL,
	CONSTRAINT "pk_customer" PRIMARY KEY("id","project_id"),
	CONSTRAINT "stripe_customer_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_domains" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"workspace_id" varchar(36) NOT NULL,
	"name" text NOT NULL,
	"apex_name" text NOT NULL,
	"verified" boolean DEFAULT false,
	CONSTRAINT "unprice_domains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "unprice_features" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"slug" text NOT NULL,
	"code" serial NOT NULL,
	"title" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "features_pkey" PRIMARY KEY("project_id","id")
);
--> statement-breakpoint
CREATE TABLE "unprice_ingestions" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"schema" text NOT NULL,
	"hash" text NOT NULL,
	"parent" text,
	"origin" text NOT NULL,
	"apikey_id" varchar(36) NOT NULL,
	CONSTRAINT "ingestions_pkey" PRIMARY KEY("project_id","id")
);
--> statement-breakpoint
CREATE TABLE "unprice_pages" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
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
CREATE TABLE "unprice_payment_provider_config" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"payment_provider" "payment_providers" DEFAULT 'stripe' NOT NULL,
	"key" text NOT NULL,
	"key_iv" text NOT NULL,
	CONSTRAINT "pk_ppconfig" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_plans" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
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
CREATE TABLE "unprice_plan_versions_features" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"plan_version_id" varchar(36) NOT NULL,
	"feature_id" varchar(36) NOT NULL,
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
CREATE TABLE "unprice_plan_versions" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"plan_id" varchar(36) NOT NULL,
	"description" text,
	"latest" boolean DEFAULT false,
	"title" varchar(50) NOT NULL,
	"tags" json,
	"active" boolean DEFAULT true,
	"plan_version_status" "plan_version_status" DEFAULT 'draft',
	"published_at_m" bigint,
	"published_by" varchar(36),
	"archived" boolean DEFAULT false,
	"archived_at_m" bigint,
	"archived_by" varchar(36),
	"payment_providers" "payment_providers" NOT NULL,
	"plan_type" "plan_type" DEFAULT 'recurring' NOT NULL,
	"currency" "currency" NOT NULL,
	"billing_interval" "billing_interval" DEFAULT 'month' NOT NULL,
	"billing_interval_count" integer DEFAULT 1 NOT NULL,
	"billing_anchor" integer DEFAULT 1 NOT NULL,
	"when_to_bill" "when_to_bill" DEFAULT 'pay_in_advance' NOT NULL,
	"grace_period" integer DEFAULT 0,
	"collection_method" "collection_method" DEFAULT 'charge_automatically' NOT NULL,
	"trial_days" integer DEFAULT 0 NOT NULL,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"metadata" json,
	"payment_method_required" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "plan_versions_plan_id_fkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_projects" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"is_main" boolean DEFAULT false,
	"default_currency" "currency" NOT NULL,
	"timezone" varchar(32) NOT NULL,
	CONSTRAINT "unique_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "unprice_invoices" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"subscription_id" varchar(36) NOT NULL,
	"subscription_phase_id" varchar(36) NOT NULL,
	"required_payment_method" boolean DEFAULT false NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"type" "invoice_type" DEFAULT 'hybrid' NOT NULL,
	"cycle_start_at_m" bigint NOT NULL,
	"cycle_end_at_m" bigint NOT NULL,
	"previous_cycle_start_at_m" bigint,
	"previous_cycle_end_at_m" bigint,
	"sent_at_m" bigint,
	"prorated" boolean DEFAULT false NOT NULL,
	"when_to_bill" "when_to_bill" DEFAULT 'pay_in_advance' NOT NULL,
	"payment_attempts" json,
	"due_at_m" bigint NOT NULL,
	"paid_at_m" bigint,
	"customer_credit_id" varchar(36),
	"amount_credit_used" integer DEFAULT 0,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"collection_method" "collection_method" DEFAULT 'charge_automatically' NOT NULL,
	"invoice_id" text,
	"invoice_url" text,
	"payment_providers" "payment_providers" NOT NULL,
	"currency" "currency" NOT NULL,
	"past_due_at_m" bigint NOT NULL,
	"metadata" json,
	CONSTRAINT "invoices_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_subscription_items" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"units" integer,
	"feature_plan_version_id" varchar(36) NOT NULL,
	"subscription_phase_id" varchar(36) NOT NULL,
	CONSTRAINT "subscription_items_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_subscription_phases" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"subscription_id" varchar(36) NOT NULL,
	"plan_version_id" varchar(36) NOT NULL,
	"payment_method_id" text,
	"trial_days" integer DEFAULT 0 NOT NULL,
	"due_behaviour" "due_behaviour" DEFAULT 'cancel' NOT NULL,
	"when_to_bill" "when_to_bill" DEFAULT 'pay_in_advance' NOT NULL,
	"grace_period" integer DEFAULT 1 NOT NULL,
	"collection_method" "collection_method" DEFAULT 'charge_automatically' NOT NULL,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"billing_interval" "billing_interval" DEFAULT 'month' NOT NULL,
	"billing_interval_count" integer DEFAULT 1 NOT NULL,
	"billing_anchor" integer DEFAULT 1 NOT NULL,
	"trial_ends_at_m" bigint,
	"start_at_m" bigint NOT NULL,
	"end_at_m" bigint,
	"metadata" json,
	CONSTRAINT "subscription_phases_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_subscriptions" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"customers_id" varchar(36) NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"plan_slug" text DEFAULT 'FREE',
	"timezone" varchar(32) DEFAULT 'UTC' NOT NULL,
	"previous_cycle_start_at_m" bigint,
	"previous_cycle_end_at_m" bigint,
	"current_cycle_start_at_m" bigint NOT NULL,
	"current_cycle_end_at_m" bigint NOT NULL,
	"next_invoice_at_m" bigint DEFAULT 0 NOT NULL,
	"last_invoice_at_m" bigint,
	"last_renew_at_m" bigint,
	"renew_at_m" bigint DEFAULT 0 NOT NULL,
	"past_due_at_m" bigint,
	"past_dued_at_m" bigint,
	"cancel_at_m" bigint,
	"canceled_at_m" bigint,
	"expires_at_m" bigint,
	"expired_at_m" bigint,
	"change_at_m" bigint,
	"changed_at_m" bigint,
	"metadata" json,
	CONSTRAINT "subscriptions_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_invites" (
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"workspace_id" varchar(36) NOT NULL,
	"email" text NOT NULL,
	"role" "team_roles" DEFAULT 'MEMBER' NOT NULL,
	"accepted_at_m" bigint,
	CONSTRAINT "invites_pkey" PRIMARY KEY("email","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_members" (
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"workspace_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"role" "team_roles" DEFAULT 'MEMBER' NOT NULL,
	CONSTRAINT "members_pkey" PRIMARY KEY("user_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "unprice_workspaces" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_personal" boolean DEFAULT false NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"image_url" text,
	"unprice_customer_id" text NOT NULL,
	"plan" text,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "unprice_workspaces_slug_unique" UNIQUE("slug"),
	CONSTRAINT "unprice_customer_id" UNIQUE("unprice_customer_id")
);
--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ADD CONSTRAINT "unprice_apikeys_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_account" ADD CONSTRAINT "unprice_account_userId_unprice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."unprice_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_authenticator" ADD CONSTRAINT "unprice_authenticator_userId_unprice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."unprice_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_session" ADD CONSTRAINT "unprice_session_userId_unprice_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."unprice_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customer_credits" ADD CONSTRAINT "unprice_customer_credits_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customer_credits" ADD CONSTRAINT "customer_credits_customer_id_fkey" FOREIGN KEY ("customer_id","project_id") REFERENCES "public"."unprice_customers"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customer_credits" ADD CONSTRAINT "project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "unprice_customer_entitlements_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "feature_plan_version_id_fkey" FOREIGN KEY ("feature_plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions_features"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "subscription_item_id_fkey" FOREIGN KEY ("subscription_item_id","project_id") REFERENCES "public"."unprice_subscription_items"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "customer_id_fkey" FOREIGN KEY ("customer_id","project_id") REFERENCES "public"."unprice_customers"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customer_entitlements" ADD CONSTRAINT "project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customers" ADD CONSTRAINT "unprice_customers_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_customers" ADD CONSTRAINT "project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_domains" ADD CONSTRAINT "fk_domain_workspace" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_features" ADD CONSTRAINT "unprice_features_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_ingestions" ADD CONSTRAINT "unprice_ingestions_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_ingestions" ADD CONSTRAINT "ingestions_apikey_id_fkey" FOREIGN KEY ("apikey_id","project_id") REFERENCES "public"."unprice_apikeys"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_pages" ADD CONSTRAINT "unprice_pages_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_payment_provider_config" ADD CONSTRAINT "unprice_payment_provider_config_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_plans" ADD CONSTRAINT "unprice_plans_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ADD CONSTRAINT "unprice_plan_versions_features_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ADD CONSTRAINT "plan_versions_id_fkey" FOREIGN KEY ("plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions_features" ADD CONSTRAINT "features_id_fkey" FOREIGN KEY ("feature_id","project_id") REFERENCES "public"."unprice_features"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD CONSTRAINT "unprice_plan_versions_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD CONSTRAINT "unprice_plan_versions_published_by_unprice_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."unprice_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD CONSTRAINT "unprice_plan_versions_archived_by_unprice_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."unprice_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ADD CONSTRAINT "plan_versions_plan_id_pkey" FOREIGN KEY ("plan_id","project_id") REFERENCES "public"."unprice_plans"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_projects" ADD CONSTRAINT "fk_project_workspace" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD CONSTRAINT "unprice_invoices_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id","project_id") REFERENCES "public"."unprice_subscriptions"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD CONSTRAINT "invoices_subscription_phase_id_fkey" FOREIGN KEY ("subscription_phase_id","project_id") REFERENCES "public"."unprice_subscription_phases"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD CONSTRAINT "invoices_customer_credit_id_fkey" FOREIGN KEY ("customer_credit_id","project_id") REFERENCES "public"."unprice_customer_credits"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ADD CONSTRAINT "unprice_subscription_items_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ADD CONSTRAINT "subscription_items_plan_version_id_fkey" FOREIGN KEY ("feature_plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions_features"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ADD CONSTRAINT "subscription_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscription_items" ADD CONSTRAINT "subscription_items_subscription_phase_id_fkey" FOREIGN KEY ("subscription_phase_id","project_id") REFERENCES "public"."unprice_subscription_phases"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" ADD CONSTRAINT "unprice_subscription_phases_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" ADD CONSTRAINT "subscription_phases_plan_version_id_fkey" FOREIGN KEY ("plan_version_id","project_id") REFERENCES "public"."unprice_plan_versions"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" ADD CONSTRAINT "subscription_phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" ADD CONSTRAINT "subscription_phases_subscription_id_fkey" FOREIGN KEY ("subscription_id","project_id") REFERENCES "public"."unprice_subscriptions"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD CONSTRAINT "unprice_subscriptions_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customers_id","project_id") REFERENCES "public"."unprice_customers"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD CONSTRAINT "subscriptions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_invites" ADD CONSTRAINT "invites_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."unprice_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_members" ADD CONSTRAINT "members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ADD CONSTRAINT "unprice_workspaces_created_by_unprice_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."unprice_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "key" ON "unprice_apikeys" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "hash" ON "unprice_apikeys" USING btree ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_credits_customer_id_active_key" ON "unprice_customer_credits" USING btree ("customer_id","active") WHERE "unprice_customer_credits"."active" = true;--> statement-breakpoint
CREATE INDEX "email" ON "unprice_customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "name" ON "unprice_domains" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "slug_feature" ON "unprice_features" USING btree ("slug","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "slug_page" ON "unprice_pages" USING btree ("slug","project_id");--> statement-breakpoint
CREATE INDEX "subdomain_index" ON "unprice_pages" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX "custom_domain_index" ON "unprice_pages" USING btree ("custom_domain");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_payment_provider_config" ON "unprice_payment_provider_config" USING btree ("payment_provider","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "slug_plan" ON "unprice_plans" USING btree ("slug","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "main_project" ON "unprice_projects" USING btree ("is_main") WHERE "unprice_projects"."is_main" = true;--> statement-breakpoint
CREATE INDEX "slug_index" ON "unprice_projects" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "main_workspace" ON "unprice_workspaces" USING btree ("is_main") WHERE "unprice_workspaces"."is_main" = true;