ALTER TABLE "builderai_customers" ADD COLUMN "default_currency" "currency" DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "builderai_projects" ADD COLUMN "default_currency" "currency" DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "builderai_customer_payment_providers" DROP COLUMN IF EXISTS "default_payment_method_id";