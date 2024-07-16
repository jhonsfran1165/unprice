ALTER TABLE "builderai_pages" DROP CONSTRAINT "custom_domain";--> statement-breakpoint
ALTER TABLE "builderai_pages" ADD CONSTRAINT "builderai_pages_custom_domain_unique" UNIQUE("custom_domain");