ALTER TYPE "subscription_type" ADD VALUE 'addons';--> statement-breakpoint
ALTER TABLE "builderai_subscriptions" ADD COLUMN "prorated" boolean DEFAULT true;