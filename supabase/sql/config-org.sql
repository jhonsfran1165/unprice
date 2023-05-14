CREATE OR REPLACE FUNCTION config_org(user_id uuid, org_id uuid, slug text, type organization_type, name text, image text, description text, role_user organization_roles) RETURNS text
  LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
  AS $$
  DECLARE is_default boolean = coalesce((select NOT(EXISTS(select 1 from organization_profiles where profile_id = user_id AND is_default = true))), false);
  BEGIN
    IF session_user = 'authenticator' THEN        
      INSERT INTO "organization" (id, slug, type, name, image, description) VALUES (org_id, slug, type, name, image, description);
      INSERT INTO "organization_profiles" (org_id, profile_id, role, is_default) VALUES (org_id, user_id, role_user, is_default);
      RETURN 'OK';
    END IF;
END
$$;

-- TODO: set claims with trigger instead of using a function
-- https://github.com/point-source/supabase-tenant-rbac

select * from config_org('8794ec5e-b9e2-436c-966a-bae66f17c2f9', '8794ec5e-b9e2-436c-966a-bae66f17c2f8', 'jhonsfran90', 'STARTUP', 'jhonsfran90', '', '', 'MEMBER', 'FREE', true)

-- update configs
select json_object_agg(org_id, value) from (
  select org_id, json_build_object('roles', jsonb_agg(role), 'tier', tier) as value 
  from data_orgs 
  where profile_id = '8b87cf8d-9f0e-46dd-87ae-f6ee41198db1'
  group by org_id,tier
) as data;

UPDATE auth.users set raw_app_meta_data = raw_app_meta_data || json_build_object('organizations', COALESCE((
  SELECT json_object_agg(org_id, value) FROM (
    SELECT org_id, json_build_object('roles', jsonb_agg(role), 'tier', tier) as value 
    FROM data_orgs 
    WHERE profile_id = '8b87cf8d-9f0e-46dd-87ae-f6ee41198db1'
    GROUP by org_id, tier) as data), '{}'))::jsonb
WHERE id = '8b87cf8d-9f0e-46dd-87ae-f6ee41198db1';


UPDATE auth.users set raw_app_meta_data = raw_app_meta_data || json_build_object('organizations', COALESCE((
  SELECT json_object_agg(org_id, value) FROM (
    SELECT org_id, json_build_object('roles', jsonb_agg(role), 'tier', tier) as value 
    FROM data_orgs 
    WHERE profile_id = user_id
    GROUP by org_id, tier) as data), '{}'))::jsonb
WHERE id = user_id;