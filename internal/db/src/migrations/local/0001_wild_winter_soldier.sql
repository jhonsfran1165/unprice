DROP TABLE "unprice_usage";--> statement-breakpoint
DROP INDEX IF EXISTS "key";--> statement-breakpoint
ALTER TABLE "unprice_apikeys" ADD COLUMN "hash" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hash" ON "unprice_apikeys" USING btree ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "key" ON "unprice_apikeys" USING btree ("key");