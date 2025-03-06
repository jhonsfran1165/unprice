ALTER TABLE "unprice_invoices" ADD COLUMN "invoice_payment_provider_id" text;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "invoice_payment_provider_url" text;--> statement-breakpoint
ALTER TABLE "unprice_invoices" DROP COLUMN "invoice_id";--> statement-breakpoint
ALTER TABLE "unprice_invoices" DROP COLUMN "invoice_url";