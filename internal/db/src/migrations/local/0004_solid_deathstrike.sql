CREATE TABLE IF NOT EXISTS "builderai_pages" (
	"id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"content" json,
	"name" text NOT NULL,
	CONSTRAINT "page_pkey" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_pages" ADD CONSTRAINT "builderai_pages_project_id_builderai_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."builderai_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
