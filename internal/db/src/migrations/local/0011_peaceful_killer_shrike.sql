DO $$ BEGIN
 CREATE TYPE "public"."invoice_type" AS ENUM('flat', 'usage', 'hybrid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unprice_customer_credits" (
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
ALTER TABLE "unprice_invoices" ALTER COLUMN "total" SET DATA TYPE integer USING total::integer;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ALTER COLUMN "total" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "type" "invoice_type" DEFAULT 'hybrid' NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "customer_credit_id" varchar(36);--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "amount_credit_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "subtotal" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_customer_credits" ADD CONSTRAINT "unprice_customer_credits_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_customer_credits" ADD CONSTRAINT "customer_credits_customer_id_fkey" FOREIGN KEY ("customer_id","project_id") REFERENCES "public"."unprice_customers"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "customer_credits_customer_id_active_key" ON "unprice_customer_credits" USING btree ("customer_id","active") WHERE "unprice_customer_credits"."active" = 'true';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_invoices" ADD CONSTRAINT "invoices_customer_credit_id_fkey" FOREIGN KEY ("customer_credit_id","project_id") REFERENCES "public"."unprice_customer_credits"("id","project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
