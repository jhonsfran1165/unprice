ALTER TABLE "builderai_pages" ALTER COLUMN "subdomain" SET NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subdomain_index" ON "builderai_pages" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_domain_index" ON "builderai_pages" USING btree ("custom_domain");--> statement-breakpoint
ALTER TABLE "builderai_pages" ADD CONSTRAINT "builderai_pages_custom_domain_unique" UNIQUE("custom_domain");--> statement-breakpoint
ALTER TABLE "builderai_pages" ADD CONSTRAINT "builderai_pages_subdomain_unique" UNIQUE("subdomain");