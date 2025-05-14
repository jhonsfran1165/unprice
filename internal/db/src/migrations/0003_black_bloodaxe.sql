ALTER TABLE "public"."unprice_payment_provider_config" ALTER COLUMN "payment_provider" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."unprice_plan_versions" ALTER COLUMN "payment_providers" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."unprice_invoices" ALTER COLUMN "payment_providers" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."unprice_payment_provider_config" ALTER COLUMN "payment_provider" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."unprice_plan_versions" ALTER COLUMN "payment_providers" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."unprice_invoices" ALTER COLUMN "payment_providers" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."payment_providers";--> statement-breakpoint
CREATE TYPE "public"."payment_providers" AS ENUM('stripe', 'square');--> statement-breakpoint
ALTER TABLE "public"."unprice_payment_provider_config" ALTER COLUMN "payment_provider" SET DATA TYPE "public"."payment_providers" USING "payment_provider"::"public"."payment_providers";--> statement-breakpoint
ALTER TABLE "public"."unprice_plan_versions" ALTER COLUMN "payment_providers" SET DATA TYPE "public"."payment_providers" USING "payment_providers"::"public"."payment_providers";--> statement-breakpoint
ALTER TABLE "public"."unprice_invoices" ALTER COLUMN "payment_providers" SET DATA TYPE "public"."payment_providers" USING "payment_providers"::"public"."payment_providers";--> statement-breakpoint
ALTER TABLE "public"."unprice_payment_provider_config" ALTER COLUMN "payment_provider" SET DEFAULT 'stripe';--> statement-breakpoint
ALTER TABLE "public"."unprice_plan_versions" ALTER COLUMN "payment_providers" SET DEFAULT 'stripe';--> statement-breakpoint
ALTER TABLE "public"."unprice_invoices" ALTER COLUMN "payment_providers" SET DEFAULT 'stripe';--> statement-breakpoint