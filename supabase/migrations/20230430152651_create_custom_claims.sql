drop policy "members can see only their organizations" on "public"."organization";

drop policy "owners can update their organizations" on "public"."organization";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.config_org(user_id uuid, org_id uuid, slug text, type organization_type, name text, image text, description text, role_user organization_roles, tier text, is_default boolean)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  BEGIN
    IF session_user = 'authenticator' THEN        
      INSERT INTO "organization" (id, slug, type, name, image, description) VALUES (org_id, slug, type, name, image, description);
      INSERT INTO "organization_profiles" (org_id, profile_id, role, is_default) VALUES (org_id, user_id, role_user, is_default);

      UPDATE auth.users set raw_app_meta_data = 
        raw_app_meta_data || 
        json_build_object('organizations', (SELECT COALESCE(raw_app_meta_data->'organizations', '{}')::jsonb || COALESCE(jsonb_build_object(org_id, jsonb_build_object('roles', role_user, 'tier', tier)), '{}')::jsonb from auth.users where auth.users.id = user_id))::jsonb where id = user_id;
  
      RETURN 'OK';
    END IF;
END
$function$
;

CREATE OR REPLACE FUNCTION public.delete_claim(uid uuid, claim text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    BEGIN
      IF NOT is_owner_org() THEN
        SELECT no_owner_exception();
      ELSE        
        update auth.users set raw_app_meta_data = 
          raw_app_meta_data - claim where id = uid;
        return 'OK';
      END IF;
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

CREATE OR REPLACE FUNCTION public.get_my_jwt_claim(claim text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select 
  	coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' -> claim, null)
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_jwt_claims()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select 
  	coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata', '{}'::jsonb)::jsonb
$function$
;

CREATE OR REPLACE FUNCTION public.has_role_org(org_id text, role text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
  BEGIN
    IF session_user = 'authenticator' THEN

      IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
        SELECT jwt_expired_exception(); -- jwt expired
      END IF; 

      IF coalesce((current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->'claims_admin', 'false')::bool THEN
        return true; -- user has claims_admin set to true (only a few users have this)
        
      ELSEIF coalesce((coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb -> 'app_metadata' -> 'organizations' -> org_id -> 'roles')::text, ''::text) = role THEN
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

CREATE OR REPLACE FUNCTION public.is_claims_admin()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
  BEGIN
    IF session_user = 'authenticator' THEN
      --------------------------------------------
      -- To disallow any authenticated app users
      -- from editing claims, delete the following
      -- block of code and replace it with:
      -- RETURN FALSE;
      --------------------------------------------
      IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
        SELECT jwt_expired_exception(); -- jwt expired
      END IF; 
      IF coalesce((current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->'claims_admin', 'false')::bool THEN
        return true; -- user has claims_admin set to true
      ELSE
        return false; -- user does NOT have claims_admin set to true
      END IF;
      --------------------------------------------
      -- End of block 
      --------------------------------------------
    ELSE -- not a user session, probably being called from a trigger or something
      return true;
    END IF;
  END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_member_org(org_id text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
  BEGIN
    IF session_user = 'authenticator' THEN

      IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
        SELECT jwt_expired_exception(); -- jwt expired
      END IF; 

      IF coalesce((current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->'claims_admin', 'false')::bool THEN
        return true; -- user has claims_admin set to true (only a few users have this)
        
      ELSEIF coalesce((coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb -> 'app_metadata' -> 'organizations' -> org_id)::text, 'false')::bool THEN
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

CREATE OR REPLACE FUNCTION public.jwt_expired_exception()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    BEGIN
      RAISE EXCEPTION USING 
        HINT = 'Please check users credentials', 
        MESSAGE = 'JWT expired, log in again',
        DETAIL = 'this execption is raise from jwt_expired_exception()',
        ERRCODE = '10001';
    END;
$function$
;

CREATE OR REPLACE FUNCTION public.no_admin_exception()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    BEGIN
      RAISE EXCEPTION USING 
        HINT = 'Please check users credentials', 
        MESSAGE = 'You are not the admin of the system',
        DETAIL = 'this execption is raise from is_claims_admin()',
        ERRCODE = '10002';
    END;
$function$
;

CREATE OR REPLACE FUNCTION public.no_owner_exception()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    BEGIN
      RAISE EXCEPTION USING 
        HINT = 'Please check users permissions', 
        MESSAGE = 'Only owners or admins can perform this action',
        DETAIL = 'this execption is raise from no_owner_exception()',
        ERRCODE = '10000';
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
      IF NOT is_owner_org() THEN
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

create policy "only owner can delete their organizations"
on "public"."organization"
as permissive
for delete
to public
using (has_role_org((id)::text, 'OWNER'::text));


create policy "members can see only their organizations"
on "public"."organization"
as permissive
for select
to authenticated
using (is_member_org((id)::text));


create policy "owners can update their organizations"
on "public"."organization"
as permissive
for update
to public
using (has_role_org((id)::text, 'OWNER'::text))
with check (has_role_org((id)::text, 'OWNER'::text));



