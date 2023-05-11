drop policy "only owner can delete their organizations" on "public"."organization";

drop policy "owners can update their organizations" on "public"."organization";

drop function if exists "public"."get_claim"(uid uuid, claim text);

drop function if exists "public"."get_claims"(uid uuid);

alter table "public"."organization_profiles" enable row level security;

alter table "public"."organization_subscriptions" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_claim(user_id uuid, claim text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    DECLARE retval jsonb;
    BEGIN
      select coalesce(raw_app_meta_data->claim, null) from auth.users into retval where id = user_id;
      return retval;
    END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_claims(user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    DECLARE retval jsonb;
    BEGIN
      select raw_app_meta_data from auth.users into retval where id = user_id;
      return retval;
    END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_claim(uid uuid, claim text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    BEGIN
      IF NOT is_claims_admin() THEN
        SELECT no_owner_exception();
      ELSE        
        update auth.users set raw_app_meta_data = 
          raw_app_meta_data - claim where id = uid;
        return 'OK';
      END IF;
    END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_claim(uid uuid, claim text, value jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    BEGIN
      IF NOT is_claims_admin() THEN
        SELECT no_owner_exception();
      ELSE        
        update auth.users set raw_app_meta_data = 
          raw_app_meta_data || 
            json_build_object(claim, value)::jsonb where id = uid;
        return 'OK';
      END IF;
    END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_claims_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DECLARE _org_id uuid;
  BEGIN
    IF TG_TABLE_NAME::regclass::text = 'organization' THEN
      _org_id = coalesce(new.id, old.id);
    ELSE        
      _org_id = coalesce(new.org_id, old.org_id);
    END IF;

    UPDATE auth.users set raw_app_meta_data = raw_app_meta_data || json_build_object('organizations', COALESCE((
      SELECT json_object_agg(org_id, value) FROM (
        SELECT org_id, json_build_object('role', role, 'tier', tier, 'slug', org_slug, 'is_default', is_default, 'image', org_image, 'type', org_type) as value 
        FROM data_orgs
        WHERE profile_id IN (SELECT profile_id from organization_profiles where org_id = _org_id)
        GROUP by org_id, role, tier, org_slug, is_default, org_image, org_type) as data), '{}'))::jsonb
    WHERE id IN (SELECT profile_id from organization_profiles where org_id = _org_id);
  RETURN null;
END
$function$
;

create policy "authenticathed users can insert"
on "public"."organization_profiles"
as permissive
for insert
to authenticated
with check (true);


create policy "only members of the organization can select"
on "public"."organization_profiles"
as permissive
for select
to authenticated
using (is_member_org((org_id)::text));


create policy "only owners can delete"
on "public"."organization_profiles"
as permissive
for delete
to authenticated
using (has_role_org((org_id)::text, '"OWNER"'::text));


create policy "only owners can update"
on "public"."organization_profiles"
as permissive
for update
to authenticated
using (has_role_org((org_id)::text, '"OWNER"'::text))
with check (has_role_org((org_id)::text, '"OWNER"'::text));


create policy "authenticated users can create an organization subscriptions"
on "public"."organization_subscriptions"
as permissive
for insert
to authenticated
with check (true);


create policy "members can see only their organizations subscriptions"
on "public"."organization_subscriptions"
as permissive
for select
to authenticated
using (is_member_org((org_id)::text));


create policy "only owner can delete their organizations subscriptions"
on "public"."organization_subscriptions"
as permissive
for delete
to authenticated
using (has_role_org((org_id)::text, '"OWNER"'::text));


create policy "owners can update their organizations subscriptions"
on "public"."organization_subscriptions"
as permissive
for update
to authenticated
using (has_role_org((org_id)::text, '"OWNER"'::text))
with check (has_role_org((org_id)::text, '"OWNER"'::text));


create policy "only owner can delete their organizations"
on "public"."organization"
as permissive
for delete
to authenticated
using (has_role_org((id)::text, '"OWNER"'::text));


create policy "owners can update their organizations"
on "public"."organization"
as permissive
for update
to authenticated
using (has_role_org((id)::text, '"OWNER"'::text))
with check (has_role_org((id)::text, '"OWNER"'::text));


CREATE TRIGGER update_claims_user_org AFTER UPDATE ON public.organization FOR EACH ROW EXECUTE FUNCTION update_claims_user();


