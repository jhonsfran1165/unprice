CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_profile_auth();

create type "public"."subscription_interval" as enum ('day', 'week', 'month', 'year');

create type "public"."subscription_status" as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid');

create table "public"."organization" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp without time zone not null default now(),
    "name" character varying not null,
    "slug" character varying not null default uuid_generate_v4(),
    "image" character varying,
    "type" text not null default 'personal'::text,
    "description" text,
    "stripe_id" text
);


alter table "public"."organization" enable row level security;

create table "public"."organization_profiles" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "role" text not null default 'member'::text,
    "profile_id" uuid not null,
    "org_id" uuid not null,
    "is_default" boolean not null default false
);


create table "public"."organization_subscriptions" (
    "id" uuid not null default uuid_generate_v4(),
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
    "org_id" uuid,
    "interval" subscription_interval,
    "interval_count" numeric
);


create table "public"."page" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone not null default now(),
    "title" text not null,
    "description" text not null,
    "content" json,
    "slug" character varying not null default uuid_generate_v4(),
    "image_url" text,
    "published" boolean not null default false,
    "org_id" uuid,
    "project_id" uuid
);


create table "public"."profile" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp without time zone not null default now(),
    "username" character varying not null,
    "full_name" character varying not null,
    "avatar_url" character varying
);


create table "public"."project" (
    "id" uuid not null default uuid_generate_v4(),
    "logo" text,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "custom_domain" text,
    "subdomain" text not null,
    "org_id" uuid,
    "slug" character varying not null default uuid_generate_v4(),
    "description" text
);


CREATE UNIQUE INDEX organization_pkey ON public.organization USING btree (id);

CREATE UNIQUE INDEX organization_profiles_pkey ON public.organization_profiles USING btree (profile_id, org_id);

CREATE UNIQUE INDEX organization_slug_key ON public.organization USING btree (slug);

CREATE UNIQUE INDEX organization_subscriptions_pkey ON public.organization_subscriptions USING btree (id);

CREATE UNIQUE INDEX page_pkey ON public.page USING btree (id);

CREATE UNIQUE INDEX page_slug_key ON public.page USING btree (slug);

CREATE UNIQUE INDEX profile_id_key ON public.profile USING btree (id);

CREATE UNIQUE INDEX profile_pkey ON public.profile USING btree (id);

CREATE UNIQUE INDEX project_pkey ON public.project USING btree (id);

CREATE UNIQUE INDEX site_slug_key ON public.project USING btree (slug);

alter table "public"."organization" add constraint "organization_pkey" PRIMARY KEY using index "organization_pkey";

alter table "public"."organization_profiles" add constraint "organization_profiles_pkey" PRIMARY KEY using index "organization_profiles_pkey";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_pkey" PRIMARY KEY using index "organization_subscriptions_pkey";

alter table "public"."page" add constraint "page_pkey" PRIMARY KEY using index "page_pkey";

alter table "public"."project" add constraint "project_pkey" PRIMARY KEY using index "project_pkey";

alter table "public"."organization" add constraint "organization_slug_key" UNIQUE using index "organization_slug_key";

alter table "public"."organization_profiles" add constraint "organization_profiles_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."organization_profiles" validate constraint "organization_profiles_org_id_fkey";

alter table "public"."organization_profiles" add constraint "organization_profiles_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE not valid;

alter table "public"."organization_profiles" validate constraint "organization_profiles_profile_id_fkey";

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_org_id_fkey";

alter table "public"."page" add constraint "page_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."page" validate constraint "page_org_id_fkey";

alter table "public"."page" add constraint "page_project_id_fkey" FOREIGN KEY (project_id) REFERENCES project(id) not valid;

alter table "public"."page" validate constraint "page_project_id_fkey";

alter table "public"."page" add constraint "page_slug_key" UNIQUE using index "page_slug_key";

alter table "public"."profile" add constraint "profile_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profile" validate constraint "profile_id_fkey";

alter table "public"."profile" add constraint "profile_id_key" UNIQUE using index "profile_id_key";

alter table "public"."project" add constraint "project_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."project" validate constraint "project_org_id_fkey";

alter table "public"."project" add constraint "site_slug_key" UNIQUE using index "site_slug_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_profile_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN

  IF new.raw_user_meta_data->>'user_name' IS NOT NULL THEN
    insert into public.profile (id, username, full_name, avatar_url)
    values (
      new.id,
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url'
    );
  ELSE
    insert into public.profile (id, username, full_name, avatar_url)
    values (new.id, new.email, new.email, null);
  END IF;

  return new;

END;
$function$
;

create or replace view "public"."data_orgs" as  SELECT DISTINCT profiles.role,
    profiles.profile_id,
    profiles.org_id AS profiles_org_id,
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
    org.id AS org_id,
    org.slug AS org_slug,
    org.image AS org_image,
    org.type AS org_type,
    org.stripe_id AS org_stripe_id
   FROM ((organization_profiles profiles
     LEFT JOIN organization_subscriptions subscription ON ((subscription.org_id = profiles.org_id)))
     LEFT JOIN organization org ON ((org.id = profiles.org_id)));


CREATE OR REPLACE FUNCTION public.is_member_of(_user_id uuid, _organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$SELECT EXISTS (
  SELECT 1
  FROM organization_profiles op
  WHERE op.org_id = _organization_id
  AND op.profile_id = _user_id
)$function$
;

CREATE OR REPLACE FUNCTION public.is_role_of(_user_id uuid, _org_id uuid, _role text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$SELECT EXISTS (
  SELECT 1
  FROM organization_profiles op
  WHERE op.org_id = _org_id
  AND op.profile_id = _user_id
  AND op.role = _role
)$function$
;

create policy "authenticated users can create an organization"
on "public"."organization"
as permissive
for insert
to authenticated
with check (true);


create policy "members can see only their organizations"
on "public"."organization"
as permissive
for select
to authenticated
using (is_member_of(auth.uid(), id));


create policy "owners can update their organizations"
on "public"."organization"
as permissive
for update
to public
using (is_role_of(auth.uid(), id, 'owner'::text))
with check (is_role_of(auth.uid(), id, 'owner'::text));



