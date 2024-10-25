ALTER TYPE "invoice_status" ADD VALUE 'closed';--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "payment_attempts" json;--> statement-breakpoint
ALTER TABLE "unprice_invoices" DROP COLUMN IF EXISTS "billed_at_m";--> statement-breakpoint
ALTER TABLE "unprice_invoices" DROP COLUMN IF EXISTS "payment_method_id";--> statement-breakpoint
ALTER TABLE "unprice_invoices" DROP COLUMN IF EXISTS "when_to_bill";--> statement-breakpoint
ALTER TABLE "unprice_invoices" DROP COLUMN IF EXISTS "grace_period";