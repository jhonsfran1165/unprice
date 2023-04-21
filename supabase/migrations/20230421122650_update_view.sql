drop view if exists "public"."data_orgs";

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
    org.stripe_id AS org_stripe_id
   FROM ((organization_profiles profiles
     LEFT JOIN organization_subscriptions subscription ON ((subscription.org_id = profiles.org_id)))
     LEFT JOIN organization org ON ((org.id = profiles.org_id)));



