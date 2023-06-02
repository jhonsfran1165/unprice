drop policy "only members of the organization can select" on "public"."organization_profiles";

drop policy "only members of the organization can select" on "public"."project";

drop view if exists "public"."data_orgs";

alter table "public"."organization_subscriptions" add column "project_id" uuid;

alter table "public"."organization_subscriptions" add column "stripe_subscription_id" text;

alter table "public"."organization_subscriptions" add constraint "organization_subscriptions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE not valid;

alter table "public"."organization_subscriptions" validate constraint "organization_subscriptions_project_id_fkey";

set check_function_bodies = off;

create or replace view "public"."data_projects" as  SELECT DISTINCT profiles.role,
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
    proj.id AS project_id,
    proj.slug AS project_slug,
    proj.name AS project_name,
    proj.description AS project_description,
    proj.custom_domain AS project_domain,
    proj.subdomain AS project_subdomain,
    proj.logo AS project_logo,
    proj.created_at AS project_created_at,
    COALESCE((subscription.tier)::text, 'FREE'::text) AS tier
   FROM (((organization_profiles profiles
     LEFT JOIN organization org ON ((org.id = profiles.org_id)))
     LEFT JOIN project proj ON ((proj.org_id = org.id)))
     LEFT JOIN organization_subscriptions subscription ON ((subscription.project_id = proj.id)));


CREATE OR REPLACE FUNCTION public.is_current_org(org_id text)
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
      
      ELSEIF coalesce((coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb -> 'app_metadata' -> 'current_org' -> 'org_id')::text, ''::text) = '"' || org_id::text || '"' THEN
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

CREATE OR REPLACE FUNCTION public.set_my_claim(claim text, value jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    BEGIN
      update auth.users set raw_app_meta_data = 
        raw_app_meta_data || 
          json_build_object(claim, value)::jsonb where id = auth.uid();
      return 'OK';
    END;
$function$
;

create or replace view "public"."data_orgs" as  SELECT DISTINCT profiles.role,
    profiles.profile_id,
    profiles.org_id AS profiles_org_id,
    profiles.is_default,
    org.id AS org_id,
    org.slug AS org_slug,
    org.image AS org_image,
    org.type AS org_type,
    org.stripe_id AS org_stripe_id,
    COALESCE((subscription.tier)::text, 'FREE'::text) AS tier
   FROM ((organization_profiles profiles
     LEFT JOIN organization_subscriptions subscription ON ((subscription.org_id = profiles.org_id)))
     LEFT JOIN organization org ON ((org.id = profiles.org_id)));


create policy "only members of the organization can select"
on "public"."organization_profiles"
as permissive
for select
to authenticated
using ((is_member_org((org_id)::text) AND is_current_org((org_id)::text)));


create policy "only members of the organization can select"
on "public"."project"
as permissive
for select
to authenticated
using ((is_member_org((org_id)::text) AND is_current_org((org_id)::text)));



