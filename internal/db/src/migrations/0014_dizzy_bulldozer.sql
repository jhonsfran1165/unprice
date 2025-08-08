ALTER TABLE "unprice_pages" ALTER COLUMN "title" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "unprice_pages" ADD COLUMN IF NOT EXISTS "name" text DEFAULT '' NOT NULL;