drop trigger if exists "delete_claims_user" on "public"."organization_profiles";

drop trigger if exists "update_claims_user" on "public"."organization_profiles";

drop trigger if exists "update_claims_user_org" on "public"."organization";

drop trigger if exists "update_claims_user_subscription" on "public"."organization_subscriptions";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_claims_org_user()
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

CREATE OR REPLACE FUNCTION public.update_claims_org_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DECLARE _org_id uuid;
  DECLARE _data record;
  BEGIN
    IF TG_TABLE_NAME::regclass::text = 'organization' THEN
      _org_id = coalesce(new.id, old.id);
    ELSE        
      _org_id = coalesce(new.org_id, old.org_id);
    END IF;

    -- _data is a structure that contains an element for each column in the select list
    FOR _data IN (SELECT profile_id, json_object_agg(org_id, value) as json_data FROM (SELECT profile_id, org_id, json_build_object('role', role, 'tier', tier, 'slug', org_slug, 'is_default', is_default, 'image', org_image, 'type', org_type) as value 
        FROM data_orgs WHERE profile_id IN (SELECT profile_id from organization_profiles where org_id = _org_id)) as data group by profile_id)
    LOOP
      UPDATE auth.users 
      SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}') || COALESCE(jsonb_build_object('organizations', COALESCE(_data.json_data, '{}')::jsonb), '{}')
      WHERE id = _data.profile_id;
    END LOOP;
  RETURN null;
END
$function$
;

CREATE TRIGGER delete_claims_user_org_profiles AFTER DELETE ON public.organization_profiles FOR EACH ROW EXECUTE FUNCTION delete_claims_org_user();

CREATE TRIGGER update_claims_user_org_profiles AFTER INSERT OR UPDATE ON public.organization_profiles FOR EACH ROW EXECUTE FUNCTION update_claims_org_user();

CREATE TRIGGER update_claims_user_org AFTER UPDATE ON public.organization FOR EACH ROW EXECUTE FUNCTION update_claims_org_user();

CREATE TRIGGER update_claims_user_subscription AFTER INSERT OR UPDATE ON public.organization_subscriptions FOR EACH ROW EXECUTE FUNCTION update_claims_org_user();


