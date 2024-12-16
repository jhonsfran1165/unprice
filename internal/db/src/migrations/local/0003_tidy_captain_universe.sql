CREATE TABLE IF NOT EXISTS "unprice_payment_provider_config" (
	"id" varchar(36) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"payment_provider" "payment_providers" DEFAULT 'stripe' NOT NULL,
	"key" text NOT NULL,
	CONSTRAINT "pk_ppconfig" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_payment_provider_config" ADD CONSTRAINT "unprice_payment_provider_config_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_payment_provider_config" ON "unprice_payment_provider_config" USING btree ("payment_provider","project_id");