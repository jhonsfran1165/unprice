DROP VIEW public.data_orgs; 

CREATE VIEW public.data_orgs WITH (security_invoker) AS
 SELECT DISTINCT profiles.role,
    profiles.profile_id,
    profiles.org_id as profiles_org_id,
    profiles.is_default,
    org.id as org_id,
    org.slug AS org_slug,
    org.image AS org_image,
    org.type AS org_type,
    org.stripe_id AS org_stripe_id,
    coalesce(subscription."tier"::text, 'FREE'::text) as tier
   FROM public.organization_profiles profiles
     LEFT JOIN public.organization_subscriptions subscription ON subscription.org_id = profiles.org_id
     LEFT JOIN public.organization org ON org.id = profiles.org_id;

DROP VIEW public.data_projects; 

CREATE VIEW public.data_projects WITH (security_invoker) AS
  SELECT DISTINCT profiles.role,
    profiles.profile_id,
    profiles.org_id as profiles_org_id,
    profiles.is_default,
    subscription.status AS status_subscription,
    subscription."interval" AS subscription_interval,
    subscription."metadata" AS subscription_metadata,
    subscription."interval_count" AS subscription_interval_count,
    subscription.current_period_start AS subscription_period_starts,
    subscription.current_period_end AS subscription_period_ends,
    subscription.ended_at AS subscription_ended_at,
    subscription.canceled_at AS subscription_canceled_at,
    subscription.trial_start AS subscription_trial_starts,
    subscription.trial_end AS subscription_trial_ends,
    org.id as org_id,
    org.slug AS org_slug,
    org.image AS org_image,
    org.type AS org_type,
    org.stripe_id AS org_stripe_id,
    proj.id AS project_id,
    proj.slug AS project_slug,
    proj.name AS project_name,
    proj.description AS project_description,
    proj.custom_domain AS project_domain,
    proj.subdomain AS project_subdomain,
    proj.logo AS project_logo,
    proj.created_at AS project_created_at,
    coalesce(subscription."tier"::text, 'FREE'::text) as tier
   FROM public.organization_profiles profiles
     LEFT JOIN public.organization org ON org.id = profiles.org_id
     LEFT JOIN public.project proj ON proj.org_id = org.id
     LEFT JOIN public.organization_subscriptions subscription ON subscription.project_id = proj.id;


create or alter type subscription_interval as enum ('day', 'week', 'month', 'year');
create or alter type organization_roles as enum ('OWNER', 'MEMBER');
create or alter type organization_tiers as enum ('FREE', 'PRO', 'CUSTOM');
create or alter type organization_type as enum ('STARTUP', 'PERSONAL', 'BUSSINESS');


-- SELECT get_claim('8794ec5e-b9e2-436c-966a-bae66f17c2f9', 'userrole')

-- select set_claim('8794ec5e-b9e2-436c-966a-bae66f17c2f9', 'userrole', '"MANAGER"');

CREATE OR REPLACE FUNCTION no_owner_exception() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      RAISE EXCEPTION USING 
        HINT = 'Please check users permissions', 
        MESSAGE = arg,
        DETAIL = 'Put here more info for debugging',
        ERRCODE = '10000';
    END;
$$;

CREATE OR REPLACE FUNCTION jwt_expired_exception() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      RAISE EXCEPTION USING 
        HINT = 'Please check users permissions', 
        MESSAGE = arg,
        DETAIL = 'Put here more info for debugging',
        ERRCODE = '10000';
    END;
$$;


CREATE OR REPLACE FUNCTION set_claim(uid uuid, claim text, value jsonb) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      IF NOT is_claims_admin() THEN
          RETURN 'error: access denied';
      ELSE        
        update auth.users set raw_app_meta_data = 
          raw_app_meta_data || 
            json_build_object(claim, value)::jsonb where id = uid;
        return 'OK';
      END IF;
    END;
$$;


jsonb_path_exists('{"a":1, "b":2}', '$.* ? (@ == 2)');



set_claim('41203b9d-917c-4aed-84dc-be60adc7d90c', 'organizations', '{"41203b9d-917c-4aed-84dc-be60adc7d908": {"roles": "role","tier": "FREE"}}') 


json_extract_path(('{"organizations": {"41203b9d-917c-4aed-84dc-be60adc7d908": {"roles": "role","tier": "FREE"}}}'::json)->'organization', '41203b9d-917c-4aed-84dc-be60adc7d908')::jsonb->'roles'

coalesce(nullif('{"organization": {"41203b9d-917c-4aed-84dc-be60adc7d908": {"roles": "role","tier": "FREE"}}}'::jsonb -> 'app_metadata' -> 'organizations' -> '41203b9d-917c-4aed-84dc-be60adc7d908' -> 'role', '')




jsonb_set(
  raw_app_meta_data,
  array [claim::text],
  jsonb_set(
    coalesce(raw_app_meta_data->claim, '{}'::jsonb),
    array [_group_id::text],
    coalesce(
      (
        select jsonb_agg("role")
        from group_users gu
        where gu.group_id = _group_id
          and gu.user_id = _user_id
      ),
      '[]'::jsonb
    )
  )
)


SET SESSION request.jwt.claims to '{"sub":"SOMEUUID" }'; set role authenticated; select auth.uid();