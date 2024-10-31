DO $$ BEGIN
 CREATE TYPE "public"."due_behaviour" AS ENUM('cancel', 'downgrade');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "subscription_status" ADD VALUE 'changed';--> statement-breakpoint
ALTER TABLE "unprice_plan_versions" ALTER COLUMN "payment_method_required" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "required_payment_method" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "previous_cycle_start_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "previous_cycle_end_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "sent_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "when_to_bill" "when_to_bill" DEFAULT 'pay_in_advance' NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_invoices" ADD COLUMN "metadata" json;--> statement-breakpoint
ALTER TABLE "unprice_subscription_phases" ADD COLUMN "due_behaviour" "due_behaviour" DEFAULT 'cancel' NOT NULL;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "previous_cycle_start_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_subscriptions" ADD COLUMN "previous_cycle_end_at_m" bigint;--> statement-breakpoint
ALTER TABLE "unprice_invoices" DROP COLUMN IF EXISTS "invoice_type";