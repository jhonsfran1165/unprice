CREATE OR REPLACE FUNCTION no_owner_exception() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      RAISE EXCEPTION USING 
        HINT = 'Please check users permissions', 
        MESSAGE = 'Only owners or admins can perform this action',
        DETAIL = 'this execption is raise from no_owner_exception()',
        ERRCODE = '10000';
    END;
$$;

CREATE OR REPLACE FUNCTION jwt_expired_exception() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      RAISE EXCEPTION USING 
        HINT = 'Please check users credentials', 
        MESSAGE = 'JWT expired, log in again',
        DETAIL = 'this execption is raise from jwt_expired_exception()',
        ERRCODE = '10001';
    END;
$$;

CREATE OR REPLACE FUNCTION no_admin_exception() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      RAISE EXCEPTION USING 
        HINT = 'Please check users credentials', 
        MESSAGE = 'You are not the admin of the system',
        DETAIL = 'this execption is raise from is_claims_admin()',
        ERRCODE = '10002';
    END;
$$;

CREATE OR REPLACE FUNCTION is_claims_admin() RETURNS "bool"
  LANGUAGE "plpgsql" 
  AS $$
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
$$;

CREATE OR REPLACE FUNCTION is_member_org(org_id text) RETURNS "bool"
  LANGUAGE "plpgsql" 
  AS $$
  BEGIN
    IF session_user = 'authenticator' THEN

      IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
        SELECT jwt_expired_exception(); -- jwt expired
      END IF; 

      IF coalesce((current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->'claims_admin', 'false')::bool THEN
        return true; -- user has claims_admin set to true (only a few users have this)
        
      ELSEIF coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb -> 'app_metadata' -> 'organizations' -> org_id IS NOT NULL THEN
        return true; -- user is the owner of their organization

      ELSE
        return false;
      END IF;

    ELSE -- not a user session, probably being called from a trigger or something
      return true;
    END IF;
  END;
$$;

CREATE OR REPLACE FUNCTION has_role_org(org_id text, role text) RETURNS "bool"
  LANGUAGE "plpgsql" 
  AS $$
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
$$;

CREATE OR REPLACE FUNCTION get_my_jwt_claims() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  	coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata', '{}'::jsonb)::jsonb
$$;

CREATE OR REPLACE FUNCTION get_my_jwt_claim(claim TEXT) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  	coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' -> claim, null)
$$;

CREATE OR REPLACE FUNCTION get_claims(uid uuid) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    DECLARE retval jsonb;
    BEGIN
      IF NOT is_owner_org() THEN
          SELECT no_owner_exception();
      ELSE
        select raw_app_meta_data from auth.users into retval where id = uid::uuid;
        return retval;
      END IF;
    END;
$$;

CREATE OR REPLACE FUNCTION get_claim(uid uuid, claim text) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    DECLARE retval jsonb;
    BEGIN
      IF NOT is_owner_org() THEN
          SELECT no_owner_exception();
      ELSE
        select coalesce(raw_app_meta_data->claim, null) from auth.users into retval where id = uid::uuid;
        return retval;
      END IF;
    END;
$$;

CREATE OR REPLACE FUNCTION set_claim(uid uuid, claim text, value jsonb) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
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
$$;

CREATE OR REPLACE FUNCTION delete_claim(uid uuid, claim text) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      IF NOT is_owner_org() THEN
        SELECT no_owner_exception();
      ELSE        
        update auth.users set raw_app_meta_data = 
          raw_app_meta_data - claim where id = uid;
        return 'OK';
      END IF;
    END;
$$;
NOTIFY pgrst, 'reload schema';