ALTER TABLE "unprice_domains" DROP CONSTRAINT "fk_domain_workspace";
--> statement-breakpoint
ALTER TABLE "unprice_projects" DROP CONSTRAINT "fk_project_workspace";
--> statement-breakpoint
ALTER TABLE "unprice_invites" DROP CONSTRAINT "invites_workspace_id_fkey";
--> statement-breakpoint
ALTER TABLE "unprice_members" DROP CONSTRAINT "members_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "unprice_members" DROP CONSTRAINT "members_workspace_id_fkey";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_domains" ADD CONSTRAINT "fk_domain_workspace" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_projects" ADD CONSTRAINT "fk_project_workspace" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_invites" ADD CONSTRAINT "invites_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."unprice_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unprice_members" ADD CONSTRAINT "members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."unprice_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
