ALTER TABLE "unprice_subscriptions" RENAME COLUMN "next_plan_version_to" TO "next_plan_version_id";--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "next_plan_version_id" SET DATA TYPE varchar(64);