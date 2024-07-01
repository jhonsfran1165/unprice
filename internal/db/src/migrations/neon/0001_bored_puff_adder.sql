CREATE TABLE IF NOT EXISTS "builderai_authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "builderai_authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID"),
	CONSTRAINT "builderai_authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
ALTER TABLE "builderai_customers" ALTER COLUMN "default_currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "builderai_subscriptions" ADD COLUMN "next_plan_version_to" text;--> statement-breakpoint
ALTER TABLE "builderai_subscriptions" ADD COLUMN "plan_changed" timestamp;--> statement-breakpoint
ALTER TABLE "builderai_subscriptions" ADD COLUMN "next_subscription_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builderai_authenticator" ADD CONSTRAINT "builderai_authenticator_userId_builderai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."builderai_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
