DROP VIEW public.data_orgs; 

CREATE VIEW public.data_orgs AS
 SELECT DISTINCT profiles.role,
    profiles.profile_id,
    profiles.org_id,
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
    org.slug AS org_slug,
    org.image AS org_image,
    org.type AS org_type,
    org.stripe_id AS org_stripe_id
   FROM ((public.organization_profiles profiles
     LEFT JOIN public.organization_subscriptions subscription ON ((profiles.org_id = subscription.org_id)))
     LEFT JOIN public.organization org ON ((profiles.org_id = org.id)));

create type subscription_interval as enum ('day', 'week', 'month', 'year');
