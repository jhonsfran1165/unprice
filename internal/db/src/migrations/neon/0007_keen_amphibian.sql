ALTER TABLE "builderai_pages" RENAME COLUMN "name" TO "title";--> statement-breakpoint
ALTER TABLE "builderai_pages" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "builderai_pages" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "builderai_pages" ADD COLUMN "font" text;--> statement-breakpoint
ALTER TABLE "builderai_pages" ADD COLUMN "published" boolean DEFAULT false NOT NULL;