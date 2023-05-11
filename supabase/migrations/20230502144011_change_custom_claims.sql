drop policy "only owner can delete their organizations" on "public"."organization";

drop policy "owners can update their organizations" on "public"."organization";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.custom_exception(message text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    BEGIN
      RAISE EXCEPTION USING 
        HINT = 'Please check users permissions', 
        MESSAGE = message,
        DETAIL = 'this execption is raise from no_owner_exception()',
        ERRCODE = '10000';
    END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_claim(uid uuid, claim text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    DECLARE retval jsonb;
    BEGIN
      IF NOT is_owner_org() THEN
        SELECT no_owner_exception();
      ELSE
        select coalesce(raw_app_meta_data->claim, null) from auth.users into retval where id = uid::uuid;
        return retval;
      END IF;
    END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_claims(uid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    DECLARE retval jsonb;
    BEGIN
      IF NOT is_owner_org() THEN
        SELECT no_owner_exception();
      ELSE
        select raw_app_meta_data from auth.users into retval where id = uid::uuid;
        return retval;
      END IF;
    END;
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

      ELSEIF coalesce((select raw_app_meta_data-> 'organizations' -> org_id -> 'role' from auth.users where id = auth.uid())::text, ''::text)::text = role THEN
        return true; -- user can create org and the jwt is not up to date

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

      ELSEIF (coalesce((select raw_app_meta_data-> 'organizations' -> org_id -> 'role' from auth.users where id = auth.uid())::text, ''::text)) IS NOT NULL THEN
        return true; -- user can create org and the jwt is not up to date

      ELSE
        return false;
      END IF;

    ELSE -- not a user session, probably being called from a trigger or something
      return true;
    END IF;
  END;
$function$
;

create policy "only owner can delete their organizations"
on "public"."organization"
as permissive
for delete
to public
using (has_role_org((id)::text, '"OWNER"'::text));


create policy "owners can update their organizations"
on "public"."organization"
as permissive
for update
to public
using (has_role_org((id)::text, '"OWNER"'::text))
with check (has_role_org((id)::text, '"OWNER"'::text));



