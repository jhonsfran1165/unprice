ALTER TYPE "subscription_status" ADD VALUE 'pending_invoice';--> statement-breakpoint
ALTER TABLE "unprice_invoices" ALTER COLUMN "past_due_at_m" SET NOT NULL;