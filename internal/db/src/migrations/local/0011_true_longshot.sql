ALTER TABLE "builderai_pages" DROP CONSTRAINT "custom_domain";--> statement-breakpoint
ALTER TABLE "builderai_pages" ADD CONSTRAINT "custom_domain" UNIQUE("custom_domain");