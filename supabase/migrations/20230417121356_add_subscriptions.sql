create type "public"."subscription_interval" as enum ('day', 'week', 'month', 'year');

create type "public"."subscription_status" as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid');

create table "public"."organization_subscriptions" (
    "id" text not null,
    "status" subscription_status,
    "metadata" jsonb,
    "price_id" text,
    "quantity" integer,
    "cancel_at_period_end" boolean,
    "currency" text,
    "created" timestamp with time zone not null default timezone('utc'::text, now()),
    "current_period_start" timestamp with time zone not null default timezone('utc'::text, now()),
    "current_period_end" timestamp with time zone not null default timezone('utc'::text, now()),
    "ended_at" timestamp with time zone default timezone('utc'::text, now()),
    "cancel_at" timestamp with time zone default timezone('utc'::text, now()),
    "canceled_at" timestamp with time zone default timezone('utc'::text, now()),
    "trial_start" timestamp with time zone default timezone('utc'::text, now()),
    "trial_end" timestamp with time zone default timezone('utc'::text, now()),
    "org_id" bigint,
    "interval" subscription_interval,
    "interval_count" numeric
);


alter table "public"."organization" add column "stripe_id" text;

CREATE UNIQUE INDEX organization_subscriptions_pkey ON public.organization_subscriptions USING btree (id);

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_pkey" PRIMARY KEY using index "organization_subscriptions_pkey";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_org_id_fkey";

create or replace view "public"."data_orgs" as  SELECT DISTINCT profiles.role,
    profiles.profile_id,
    profiles.org_id,
    profiles.is_default,
    subscription.status AS status_subscription,
    subscription."interval" AS subscription_interval,
    subscription.metadata AS subscription_metadata,
    subscription.interval_count AS subscription_interval_count,
    subscription.current_period_start AS subscription_period_starts,
    subscription.current_period_end AS subscription_period_ends,
    subscription.ended_at AS subscription_ended_at,
    subscription.canceled_at AS subscription_canceled_at,
    subscription.trial_start AS subscription_trial_starts,
    subscription.trial_end AS subscription_trial_ends,
    org.slug AS org_slug,
    org.image AS org_image,
    org.type AS org_type,
    org.stripe_id AS org_stripe_id
   FROM ((organization_profiles profiles
     LEFT JOIN organization_subscriptions subscription ON ((profiles.org_id = subscription.org_id)))
     LEFT JOIN organization org ON ((profiles.org_id = org.id)));



