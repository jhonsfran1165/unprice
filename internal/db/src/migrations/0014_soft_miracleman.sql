ALTER TABLE "unprice_pages" ALTER COLUMN "title" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "unprice_pages" ADD COLUMN "name" text NOT NULL;