CREATE TABLE IF NOT EXISTS "builderai_customer_payment_providers" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"customer_id" text NOT NULL,
	"default_payment_method_id" text NOT NULL,
	"payment_provider" "payment_providers" NOT NULL,
	"payment_provider_customer_id" text NOT NULL,
	"metadata" json,
	CONSTRAINT "pk_customer_payment_method" PRIMARY KEY("id","project_id"),
	CONSTRAINT "builderai_customer_payment_providers_payment_provider_customer_id_unique" UNIQUE("payment_provider_customer_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_customer_payment_providers" ADD CONSTRAINT "builderai_customer_payment_providers_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_customer_payment_providers" ADD CONSTRAINT "payment_customer_id_fkey" FOREIGN KEY ("customer_id","project_id") REFERENCES "public"."builderai_customers"("id","project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_payment_provider" ON "builderai_customer_payment_providers" ("customer_id","payment_provider");