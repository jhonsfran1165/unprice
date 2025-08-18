-- Synthetic conversion funnel test data for unprice_events
-- This creates clicks and signups that correspond to the page_hits data

-- Plan clicks that follow from the page views
-- Scenario 1: session_conversion_1 clicks on starter plan
SELECT
    now() - interval 1 hour + interval 5 minute AS timestamp,
    'session_conversion_1' AS session_id,
    'plan_click' AS action,
    '1' AS version,
    '{"plan_version_id":"pv_starter_v1","page_id":"page_pricing"}' AS payload

UNION ALL

-- Scenario 2: session_conversion_2 clicks on pro plan
SELECT
    now() - interval 2 hour + interval 10 minute AS timestamp,
    'session_conversion_2' AS session_id,
    'plan_click' AS action,
    '1' AS version,
    '{"plan_version_id":"pv_pro_v2","page_id":"page_pricing"}' AS payload

UNION ALL

-- Scenario 3: session_conversion_3 clicks on enterprise plan
SELECT
    now() - interval 3 hour + interval 8 minute AS timestamp,
    'session_conversion_3' AS session_id,
    'plan_click' AS action,
    '1' AS version,
    '{"plan_version_id":"pv_enterprise_v1","page_id":"page_pricing"}' AS payload

UNION ALL

-- Scenario 4: session_conversion_4 clicks on pro plan (from multiple viewed)
SELECT
    now() - interval 4 hour + interval 15 minute AS timestamp,
    'session_conversion_4' AS session_id,
    'plan_click' AS action,
    '1' AS version,
    '{"plan_version_id":"pv_pro_v2","page_id":"page_pricing"}' AS payload

UNION ALL

-- Scenario 6: session_click_no_signup clicks on basic plan
SELECT
    now() - interval 6 hour + interval 3 minute AS timestamp,
    'session_click_no_signup' AS session_id,
    'plan_click' AS action,
    '1' AS version,
    '{"plan_version_id":"pv_basic_v3","page_id":"page_signup"}' AS payload

UNION ALL

-- Signup events that follow from the clicks
-- Scenario 1: session_conversion_1 successfully signs up for starter plan
SELECT
    now() - interval 1 hour + interval 12 minute AS timestamp,
    'session_conversion_1' AS session_id,
    'signup' AS action,
    '1' AS version,
    '{"customer_id":"cus_starter_conversion_1","plan_version_id":"pv_starter_v1","page_id":"page_pricing","status":"signup_success"}' AS payload

UNION ALL

-- Scenario 2: session_conversion_2 successfully signs up for pro plan
SELECT
    now() - interval 2 hour + interval 20 minute AS timestamp,
    'session_conversion_2' AS session_id,
    'signup' AS action,
    '1' AS version,
    '{"customer_id":"cus_pro_conversion_2","plan_version_id":"pv_pro_v2","page_id":"page_pricing","status":"signup_success"}' AS payload

UNION ALL

-- Scenario 3: session_conversion_3 fails to sign up for enterprise plan
SELECT
    now() - interval 3 hour + interval 25 minute AS timestamp,
    'session_conversion_3' AS session_id,
    'signup' AS action,
    '1' AS version,
    '{"customer_id":"cus_enterprise_conversion_3","plan_version_id":"pv_enterprise_v1","page_id":"page_pricing","status":"signup_failed"}' AS payload

UNION ALL

-- Scenario 4: session_conversion_4 signs up for pro plan but waiting for payment setup
SELECT
    now() - interval 4 hour + interval 30 minute AS timestamp,
    'session_conversion_4' AS session_id,
    'signup' AS action,
    '1' AS version,
    '{"customer_id":"cus_pro_conversion_4","plan_version_id":"pv_pro_v2","page_id":"page_pricing","status":"waiting_payment_provider_setup"}' AS payload

-- Note: session_no_click has no clicks or signups (view-only)
-- Note: session_click_no_signup has clicks but no signups (abandoned)