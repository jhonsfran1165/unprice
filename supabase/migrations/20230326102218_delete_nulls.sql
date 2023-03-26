alter table "public"."organization" add column "image" character varying;

alter table "public"."organization" add column "type" text not null default 'personal'::text;

alter table "public"."organization" alter column "created_at" set not null;

alter table "public"."organization" alter column "name" set not null;

alter table "public"."organization" alter column "updated_at" set not null;

alter table "public"."organization_profiles" alter column "created_at" set not null;

alter table "public"."organization_profiles" alter column "is_default" set not null;

alter table "public"."organization_profiles" alter column "role" set not null;

alter table "public"."organization_profiles" alter column "updated_at" set not null;

alter table "public"."page" alter column "created_at" set not null;

alter table "public"."page" alter column "description" set not null;

alter table "public"."page" alter column "published" set not null;

alter table "public"."page" alter column "title" set not null;

alter table "public"."profile" alter column "created_at" set not null;

alter table "public"."profile" alter column "full_name" set not null;

alter table "public"."profile" alter column "updated_at" set not null;

alter table "public"."profile" alter column "username" set not null;

alter table "public"."site" alter column "created_at" set not null;

alter table "public"."site" alter column "name" set not null;

alter table "public"."site" alter column "subdomain" set not null;

alter table "public"."site" alter column "updated_at" set not null;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.hello_world()
 RETURNS text
 LANGUAGE sql
AS $function$  -- 4
  select 'hello world';  -- 5
$function$
;


