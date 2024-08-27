ALTER TABLE "unprice_projects" ALTER COLUMN "default_currency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "unprice_projects" ALTER COLUMN "timezone" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "unprice_projects" ALTER COLUMN "timezone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_projects" ADD COLUMN "is_main" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "unprice_workspaces" ADD COLUMN "is_main" boolean DEFAULT false;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "main_project" ON "unprice_projects" USING btree ("is_main") WHERE "unprice_projects"."is_main" = 'true';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "main_workspace" ON "unprice_workspaces" USING btree ("is_main") WHERE "unprice_workspaces"."is_main" = 'true';--> statement-breakpoint
ALTER TABLE "unprice_workspaces" DROP COLUMN IF EXISTS "default_currency";--> statement-breakpoint
ALTER TABLE "unprice_workspaces" DROP COLUMN IF EXISTS "timezone";