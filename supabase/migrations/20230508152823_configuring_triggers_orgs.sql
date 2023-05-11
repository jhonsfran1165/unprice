alter table "public"."organization_subscriptions" add column "tier" organization_tiers default 'FREE'::organization_tiers;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.config_org(user_id uuid, org_id uuid, slug text, type organization_type, name text, image text, description text, role_user organization_roles)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DECLARE is_default boolean = coalesce((select NOT(EXISTS(select 1 from organization_profiles where profile_id = user_id AND is_default = true))), false);
  BEGIN
    IF session_user = 'authenticator' THEN        
      INSERT INTO "organization" (id, slug, type, name, image, description) VALUES (org_id, slug, type, name, image, description);
      INSERT INTO "organization_profiles" (org_id, profile_id, role, is_default) VALUES (org_id, user_id, role_user, is_default);
      RETURN 'OK';
    END IF;
END
$function$
;

CREATE OR REPLACE FUNCTION public.update_claims_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DECLARE _org_id uuid = coalesce(new.org_id, old.org_id);
  BEGIN
    UPDATE auth.users set raw_app_meta_data = raw_app_meta_data || json_build_object('organizations', COALESCE((
      SELECT json_object_agg(org_id, value) FROM (
        SELECT org_id, json_build_object('role', role, 'tier', tier, 'slug', org_slug, 'is_default', is_default) as value 
        FROM data_orgs
        WHERE profile_id IN (SELECT profile_id from organization_profiles where org_id = _org_id)
        GROUP by org_id, role, tier, org_slug, is_default) as data), '{}'))::jsonb
    WHERE id IN (SELECT profile_id from organization_profiles where org_id = _org_id);
  RETURN null;
END
$function$
;

CREATE OR REPLACE FUNCTION public.delete_claims_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DECLARE _org_id uuid = coalesce(new.org_id, old.org_id);
  BEGIN
    UPDATE auth.users set raw_app_meta_data = raw_app_meta_data || json_build_object('organizations', COALESCE((
      SELECT (raw_app_meta_data->'organizations') - _org_id::text
      FROM auth.users WHERE raw_app_meta_data->'organizations' ? _org_id::text), '{}'))::jsonb
    WHERE id IN (SELECT id from auth.users WHERE raw_app_meta_data->'organizations' ? _org_id::text);
  RETURN null;
END
$function$
;

create or replace view "public"."data_orgs" as  SELECT DISTINCT profiles.role,
    profiles.profile_id,
    profiles.org_id AS profiles_org_id,
    profiles.is_default,
    subscription.status AS status_subscription,
    subscription."interval" AS subscription_interval,
    subscription.metadata AS subscription_metadata,
    subscription.interval_count AS subscription_interval_count,
    subscription.current_period_start AS subscription_period_starts,
    subscription.current_period_end AS subscription_period_ends,
    subscription.ended_at AS subscription_ended_at,
    subscription.canceled_at AS subscription_canceled_at,
    subscription.trial_start AS subscription_trial_starts,
    subscription.trial_end AS subscription_trial_ends,
    org.id AS org_id,
    org.slug AS org_slug,
    org.image AS org_image,
    org.type AS org_type,
    org.stripe_id AS org_stripe_id,
    COALESCE((subscription.tier)::text, 'FREE'::text) AS tier
   FROM ((organization_profiles profiles
     LEFT JOIN organization_subscriptions subscription ON ((subscription.org_id = profiles.org_id)))
     LEFT JOIN organization org ON ((org.id = profiles.org_id)));


CREATE TRIGGER update_claims_user AFTER INSERT OR UPDATE ON public.organization_profiles FOR EACH ROW EXECUTE FUNCTION update_claims_user();
CREATE TRIGGER delete_claims_user AFTER DELETE ON public.organization_profiles FOR EACH ROW EXECUTE FUNCTION delete_claims_user();
CREATE TRIGGER update_claims_user_subscription AFTER INSERT OR UPDATE ON public.organization_subscriptions FOR EACH ROW EXECUTE FUNCTION update_claims_user();


