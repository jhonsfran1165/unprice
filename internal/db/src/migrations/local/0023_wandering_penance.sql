DO $$ BEGIN
 CREATE TYPE "public"."invoice_status" AS ENUM('unpaid', 'paid', 'void', 'draft');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."invoice_type" AS ENUM('flat', 'usage', 'hybrid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_billing_cycle_invoices" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"subscription_id" varchar(64) NOT NULL,
	"status" "invoice_status" DEFAULT 'unpaid' NOT NULL,
	"billing_cycle_start_at_m" bigint NOT NULL,
	"billing_cycle_end_at_m" bigint NOT NULL,
	"billed_at_m" bigint,
	"due_at_m" bigint NOT NULL,
	"paid_at_m" bigint,
	"invoice_type" "invoice_type" DEFAULT 'flat' NOT NULL,
	"total" text NOT NULL,
	"invoice_url" text,
	"collection_method" "collection_method" DEFAULT 'charge_automatically' NOT NULL,
	"invoice_id" text,
	"payment_method_id" text,
	"when_to_bill" "when_to_bill" DEFAULT 'pay_in_advance' NOT NULL,
	"payment_providers" "payment_providers" NOT NULL,
	"currency" "currency" NOT NULL,
	"grace_period" integer DEFAULT 1 NOT NULL,
	"past_due_at_m" bigint,
	CONSTRAINT "billing_cycle_invoices_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" RENAME COLUMN "billing_cycle_start_at_m" TO "current_cycle_start_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" RENAME COLUMN "billing_cycle_end_at_m" TO "current_cycle_end_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "next_invoice_at_m" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "last_change_plan_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "last_invoice_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "change_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "cancel_at_m" bigint;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_billing_cycle_invoices" ADD CONSTRAINT "unprice_billing_cycle_invoices_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_billing_cycle_invoices" ADD CONSTRAINT "billing_cycle_invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id","project_id") REFERENCES "public"."unprice_subscriptions"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "next_billing_at_m";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" DROP COLUMN IF EXISTS "last_billed_at_m";