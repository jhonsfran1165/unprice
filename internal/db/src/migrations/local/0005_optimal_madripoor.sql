ALTER TABLE "unprice_customer_sessions" DROP CONSTRAINT "unprice_customer_sessions_project_id_unprice_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "unprice_customer_sessions" DROP CONSTRAINT "pk_customer_session";--> statement-breakpoint
ALTER TABLE "unprice_customer_sessions" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "unprice_customer_sessions" DROP COLUMN IF EXISTS "project_id";