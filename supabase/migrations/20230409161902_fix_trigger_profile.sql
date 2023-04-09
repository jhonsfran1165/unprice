drop trigger if exists "on_auth_user_created" on "auth"."users";

alter table "public"."organization_profiles" drop constraint "organization_profiles_org_id_fkey";

drop function if exists "public"."create_profile"();

alter table "public"."organization" add column "description" text;

alter table "public"."organization_profiles" add constraint "organization_profiles_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."organization_profiles" validate constraint "organization_profiles_org_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_profile_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN

  IF new.raw_user_meta_data->>'username' IS NOT NULL THEN
    insert into public.profile (id, username, full_name, avatar_url)
    values (
      new.id,
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url'
    );
  ELSE
    insert into public.profile (id, username, full_name, avatar_url)
    values (new.id, new.email, new.email, 'null');
  END IF;

  return new;

END;
$function$
;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_profile_auth();
