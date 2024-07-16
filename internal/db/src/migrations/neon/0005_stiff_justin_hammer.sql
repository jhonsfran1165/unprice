ALTER TABLE "builderai_features" DROP CONSTRAINT "slug_feature";--> statement-breakpoint
ALTER TABLE "builderai_plans" DROP CONSTRAINT "slug_plan";--> statement-breakpoint
ALTER TABLE "builderai_pages" ALTER COLUMN "content" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "builderai_pages" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "builderai_pages" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "slug_feature" ON "builderai_features" USING btree ("slug","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "slug_plan" ON "builderai_plans" USING btree ("slug","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "slug_page" ON "builderai_pages" USING btree ("slug","project_id");