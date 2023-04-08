CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_profile();


alter table "public"."organization_profiles" drop constraint "organization_profiles_profile_id_fkey";

alter table "public"."page" drop constraint "page_org_id_fkey";

alter table "public"."project" drop constraint "project_org_id_fkey";

drop function if exists "public"."hello_world"();

alter table "public"."organization_profiles" add constraint "organization_profiles_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE not valid;

alter table "public"."organization_profiles" validate constraint "organization_profiles_profile_id_fkey";

alter table "public"."page" add constraint "page_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."page" validate constraint "page_org_id_fkey";

alter table "public"."project" add constraint "project_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."project" validate constraint "project_org_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_profile()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  insert into public.profile (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$function$
;


