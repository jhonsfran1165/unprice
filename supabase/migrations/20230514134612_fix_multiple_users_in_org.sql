drop function if exists "public"."is_member_of"(_user_id uuid, _organization_id uuid);

drop function if exists "public"."is_role_of"(_user_id uuid, _org_id uuid, _role text);

alter table "public"."project" alter column "org_id" set not null;

alter table "public"."project" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_claims_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DECLARE _org_id uuid = coalesce(new.org_id, old.org_id);
  DECLARE _data record;
  BEGIN
    -- _data is a structure that contains an element for each column in the select list
    FOR _data IN (SELECT id, (raw_app_meta_data->'organizations') - _org_id::text as value FROM auth.users WHERE raw_app_meta_data->'organizations' ? _org_id::text)
    LOOP
      UPDATE auth.users 
      SET raw_app_meta_data = raw_app_meta_data || json_build_object('organizations', COALESCE(_data.value, '{}'))::jsonb
      WHERE id = _data.id;
    END LOOP;
  RETURN null;
END
$function$
;

CREATE OR REPLACE FUNCTION public.has_role_org(org_id text, role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  BEGIN
    IF session_user = 'authenticator' THEN

      IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
        SELECT jwt_expired_exception(); -- jwt expired
      END IF; 

      IF coalesce((current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->'claims_admin', 'false')::bool THEN
        return true; -- user has claims_admin set to true (only a few users have this)
        
      ELSEIF coalesce((coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb -> 'app_metadata' -> 'organizations' -> org_id -> 'role')::text, ''::text) = role THEN
        return true; -- user is the owner of their organization

      ELSE
        SELECT no_owner_exception(); -- user does NOT have claims_admin set to true
      END IF;

    ELSE -- not a user session, probably being called from a trigger or something
      return true;
    END IF;
  END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_member_org(org_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  BEGIN
    IF session_user = 'authenticator' THEN

      IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
        SELECT jwt_expired_exception(); -- jwt expired
      END IF; 

      IF coalesce((current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->'claims_admin', 'false')::bool THEN
        return true; -- user has claims_admin set to true (only a few users have this)
        
      ELSEIF (coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb -> 'app_metadata' -> 'organizations' -> org_id) IS NOT NULL THEN
        return true; -- user is the owner of their organization

      ELSE
        return false;
      END IF;

    ELSE -- not a user session, probably being called from a trigger or something
      return true;
    END IF;
  END;
$function$
;

create policy "authenticathed users can insert"
on "public"."project"
as permissive
for insert
to authenticated
with check (true);


create policy "only members of the organization can select"
on "public"."project"
as permissive
for select
to authenticated
using (is_member_org((org_id)::text));


create policy "only owners can delete"
on "public"."project"
as permissive
for delete
to authenticated
using (has_role_org((org_id)::text, '"OWNER"'::text));


create policy "only owners can update"
on "public"."project"
as permissive
for update
to authenticated
using (has_role_org((org_id)::text, '"OWNER"'::text))
with check (has_role_org((org_id)::text, '"OWNER"'::text));



