ALTER TABLE "unprice_pages" ADD COLUMN "copy" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_pages" ADD COLUMN "faqs" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_pages" ADD COLUMN "color_palette" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_pages" ADD COLUMN "selected_plants" jsonb NOT NULL;