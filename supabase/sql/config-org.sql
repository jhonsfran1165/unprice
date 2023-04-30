CREATE OR REPLACE FUNCTION config_org(user_id uuid, org_id uuid, slug text, type organization_type, name text, image text, description text, role_user organization_roles, tier text, is_default boolean) RETURNS text
  LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
  AS $$
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
$$;

select * from config_org('8794ec5e-b9e2-436c-966a-bae66f17c2f9', '8794ec5e-b9e2-436c-966a-bae66f17c2f8', 'jhonsfran90', 'STARTUP', 'jhonsfran90', '', '', 'OWNER', 'FREE', true)