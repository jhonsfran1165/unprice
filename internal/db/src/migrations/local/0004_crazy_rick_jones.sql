CREATE TABLE IF NOT EXISTS "unprice_customer_sessions" (
	"id" varchar(64) NOT NULL,
	"project_id" varchar(64) NOT NULL,
	"created_at_m" bigint DEFAULT 0 NOT NULL,
	"updated_at_m" bigint DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT false,
	"customer" json,
	"plan_version" json,
	CONSTRAINT "pk_customer_session" PRIMARY KEY("id","project_id")
);
--> statement-breakpoint
ALTER TABLE "unprice_domains" DROP CONSTRAINT "unprice_domains_workspace_id_unprice_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "unprice_projects" DROP CONSTRAINT "unprice_projects_workspace_id_unprice_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "unprice_invites" DROP CONSTRAINT "unprice_invites_workspace_id_unprice_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "unprice_members" DROP CONSTRAINT "unprice_members_workspace_id_unprice_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "when_to_bill" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "start_cycle" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "grace_period" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_customer_sessions" ADD CONSTRAINT "unprice_customer_sessions_project_id_unprice_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."unprice_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_domains" ADD CONSTRAINT "fk_domain_workspace" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_projects" ADD CONSTRAINT "fk_project_workspace" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_invites" ADD CONSTRAINT "invites_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_members" ADD CONSTRAINT "members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
