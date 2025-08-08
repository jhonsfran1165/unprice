-- Complete conversion funnel test data for ClickHouse
-- Run this to populate both unprice_page_hits and unprice_events tables with realistic conversion data

-- STEP 1: Insert page hits data (plan views)
INSERT INTO unprice_page_hits
(timestamp, page_id, session_id, plan_ids, url, country, city, region, latitude, longitude,
 device, device_model, device_vendor, browser, browser_version, os, os_version, engine,
 engine_version, cpu_architecture, ua, bot, referrer, referrer_url, ip, continent, locale)

-- Scenario 1: session_conversion_1 - Views starter plan → clicks → successful signup
SELECT
    now() - interval 1 hour AS timestamp,
    'page_pricing' AS page_id,
    'session_conversion_1' AS session_id,
    ['pv_starter_v1'] AS plan_ids,
    'https://unprice.com/pricing' AS url,
    'US' AS country, 'New York' AS city, 'NY' AS region, '40.7128' AS latitude, '-74.0060' AS longitude,
    'desktop' AS device, 'Macintosh' AS device_model, 'Apple' AS device_vendor, 'Chrome' AS browser, '120.0' AS browser_version,
    'Mac OS' AS os, '14.0' AS os_version, 'Blink' AS engine, '120.0' AS engine_version, 'x86' AS cpu_architecture,
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' AS ua,
    0 AS bot, 'google.com' AS referrer, 'https://google.com/search?q=pricing' AS referrer_url,
    '127.0.0.1' AS ip, 'North America' AS continent, 'en-US' AS locale

UNION ALL

-- Scenario 2: session_conversion_2 - Views pro plan → clicks → successful signup
SELECT
    now() - interval 2 hour AS timestamp, 'page_pricing' AS page_id, 'session_conversion_2' AS session_id,
    ['pv_pro_v2'] AS plan_ids, 'https://unprice.com/pricing' AS url,
    'GB' AS country, 'London' AS city, 'London' AS region, '51.5074' AS latitude, '-0.1278' AS longitude,
    'desktop' AS device, 'Windows' AS device_model, 'Microsoft' AS device_vendor, 'Edge' AS browser, '119.0' AS browser_version,
    'Windows' AS os, '11.0' AS os_version, 'Blink' AS engine, '119.0' AS engine_version, 'x86' AS cpu_architecture,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0' AS ua,
    0 AS bot, 'twitter.com' AS referrer, 'https://twitter.com/pricing-announcement' AS referrer_url,
    '192.168.1.100' AS ip, 'Europe' AS continent, 'en-GB' AS locale

UNION ALL

-- Scenario 3: session_conversion_3 - Views enterprise plan → clicks → failed signup
SELECT
    now() - interval 3 hour AS timestamp, 'page_pricing' AS page_id, 'session_conversion_3' AS session_id,
    ['pv_enterprise_v1'] AS plan_ids, 'https://unprice.com/pricing' AS url,
    'CA' AS country, 'Toronto' AS city, 'ON' AS region, '43.6510' AS latitude, '-79.3470' AS longitude,
    'mobile' AS device, 'iOS' AS device_model, 'Apple' AS device_vendor, 'Safari' AS browser, '17.0' AS browser_version,
    'iOS' AS os, '17.0' AS os_version, 'WebKit' AS engine, '17.0' AS engine_version, 'arm' AS cpu_architecture,
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' AS ua,
    0 AS bot, '(direct)' AS referrer, '(direct)' AS referrer_url,
    '10.0.0.50' AS ip, 'North America' AS continent, 'en-CA' AS locale

UNION ALL

-- Scenario 4: session_conversion_4 - Views multiple plans → clicks pro → waiting payment setup
SELECT
    now() - interval 4 hour AS timestamp, 'page_pricing' AS page_id, 'session_conversion_4' AS session_id,
    ['pv_starter_v1', 'pv_pro_v2', 'pv_enterprise_v1'] AS plan_ids, 'https://unprice.com/pricing' AS url,
    'AU' AS country, 'Sydney' AS city, 'NSW' AS region, '33.8688' AS latitude, '151.2093' AS longitude,
    'desktop' AS device, 'Linux' AS device_model, 'Dell' AS device_vendor, 'Firefox' AS browser, '118.0' AS browser_version,
    'Linux' AS os, '22.04' AS os_version, 'Gecko' AS engine, '118.0' AS engine_version, 'x86' AS cpu_architecture,
    'Mozilla/5.0 (X11; Linux x86_64; rv:118.0) Gecko/20100101 Firefox/118.0' AS ua,
    0 AS bot, 'linkedin.com' AS referrer, 'https://linkedin.com/company/unprice' AS referrer_url,
    '172.16.0.25' AS ip, 'Australia' AS continent, 'en-AU' AS locale

UNION ALL

-- Scenario 5: session_no_click - Views but doesn't click
SELECT
    now() - interval 5 hour AS timestamp, 'page_pricing' AS page_id, 'session_no_click' AS session_id,
    ['pv_starter_v1', 'pv_pro_v2'] AS plan_ids, 'https://unprice.com/pricing' AS url,
    'DE' AS country, 'Berlin' AS city, 'Berlin' AS region, '52.5200' AS latitude, '13.4050' AS longitude,
    'mobile' AS device, 'Android' AS device_model, 'Samsung' AS device_vendor, 'Chrome' AS browser, '119.0' AS browser_version,
    'Android' AS os, '13.0' AS os_version, 'Blink' AS engine, '119.0' AS engine_version, 'arm' AS cpu_architecture,
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36' AS ua,
    0 AS bot, 'bing.com' AS referrer, 'https://bing.com/search?q=pricing+plans' AS referrer_url,
    '192.168.1.200' AS ip, 'Europe' AS continent, 'de-DE' AS locale

UNION ALL

-- Scenario 6: session_click_no_signup - Clicks but doesn't signup
SELECT
    now() - interval 6 hour AS timestamp, 'page_signup' AS page_id, 'session_click_no_signup' AS session_id,
    ['pv_basic_v3'] AS plan_ids, 'https://unprice.com/signup' AS url,
    'FR' AS country, 'Paris' AS city, 'IDF' AS region, '48.8566' AS latitude, '2.3522' AS longitude,
    'desktop' AS device, 'Windows' AS device_model, 'HP' AS device_vendor, 'Chrome' AS browser, '120.0' AS browser_version,
    'Windows' AS os, '10.0' AS os_version, 'Blink' AS engine, '120.0' AS engine_version, 'x86' AS cpu_architecture,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' AS ua,
    0 AS bot, 'unprice.com' AS referrer, 'https://unprice.com/pricing' AS referrer_url,
    '10.1.1.1' AS ip, 'Europe' AS continent, 'fr-FR' AS locale;


-- STEP 2: Insert events data (plan clicks and signups)
INSERT INTO unprice_events (timestamp, session_id, action, version, payload)

-- Plan clicks that follow from the page views
SELECT now() - interval 1 hour + interval 5 minute AS timestamp, 'session_conversion_1' AS session_id, 'plan_click' AS action, '1' AS version,
    '{"plan_version_id":"pv_starter_v1","page_id":"page_pricing"}' AS payload

UNION ALL
SELECT now() - interval 2 hour + interval 10 minute AS timestamp, 'session_conversion_2' AS session_id, 'plan_click' AS action, '1' AS version,
    '{"plan_version_id":"pv_pro_v2","page_id":"page_pricing"}' AS payload

UNION ALL
SELECT now() - interval 3 hour + interval 8 minute AS timestamp, 'session_conversion_3' AS session_id, 'plan_click' AS action, '1' AS version,
    '{"plan_version_id":"pv_enterprise_v1","page_id":"page_pricing"}' AS payload

UNION ALL
SELECT now() - interval 4 hour + interval 15 minute AS timestamp, 'session_conversion_4' AS session_id, 'plan_click' AS action, '1' AS version,
    '{"plan_version_id":"pv_pro_v2","page_id":"page_pricing"}' AS payload

UNION ALL
SELECT now() - interval 6 hour + interval 3 minute AS timestamp, 'session_click_no_signup' AS session_id, 'plan_click' AS action, '1' AS version,
    '{"plan_version_id":"pv_basic_v3","page_id":"page_signup"}' AS payload

UNION ALL

-- Signup events that follow from the clicks
SELECT now() - interval 1 hour + interval 12 minute AS timestamp, 'session_conversion_1' AS session_id, 'signup' AS action, '1' AS version,
    '{"customer_id":"cus_starter_conversion_1","plan_version_id":"pv_starter_v1","page_id":"page_pricing","status":"signup_success"}' AS payload

UNION ALL
SELECT now() - interval 2 hour + interval 20 minute AS timestamp, 'session_conversion_2' AS session_id, 'signup' AS action, '1' AS version,
    '{"customer_id":"cus_pro_conversion_2","plan_version_id":"pv_pro_v2","page_id":"page_pricing","status":"signup_success"}' AS payload

UNION ALL
SELECT now() - interval 3 hour + interval 25 minute AS timestamp, 'session_conversion_3' AS session_id, 'signup' AS action, '1' AS version,
    '{"customer_id":"cus_enterprise_conversion_3","plan_version_id":"pv_enterprise_v1","page_id":"page_pricing","status":"signup_failed"}' AS payload

UNION ALL
SELECT now() - interval 4 hour + interval 30 minute AS timestamp, 'session_conversion_4' AS session_id, 'signup' AS action, '1' AS version,
    '{"customer_id":"cus_pro_conversion_4","plan_version_id":"pv_pro_v2","page_id":"page_pricing","status":"waiting_payment_provider_setup"}' AS payload;


-- STEP 3: Expected Results for Validation
/*
EXPECTED CONVERSION RESULTS:

Plan Views (unique sessions that viewed each plan):
- pv_starter_v1: 3 sessions (session_conversion_1, session_conversion_4, session_no_click)
- pv_pro_v2: 3 sessions (session_conversion_2, session_conversion_4, session_no_click)
- pv_enterprise_v1: 3 sessions (session_conversion_3, session_conversion_4, session_no_click)
- pv_basic_v3: 1 session (session_click_no_signup)

Plan Clicks (unique sessions that clicked each plan):
- pv_starter_v1: 1 click (session_conversion_1)
- pv_pro_v2: 2 clicks (session_conversion_2, session_conversion_4)
- pv_enterprise_v1: 1 click (session_conversion_3)
- pv_basic_v3: 1 click (session_click_no_signup)

Plan Signups Completed (signup_success only):
- pv_starter_v1: 1 signup (session_conversion_1)
- pv_pro_v2: 1 signup (session_conversion_2)
- pv_enterprise_v1: 0 signups (session_conversion_3 failed)
- pv_basic_v3: 0 signups (no signup attempt)

Expected Conversion Rates (signup_success / views):
- pv_starter_v1: 1/3 = 33.33%
- pv_pro_v2: 1/3 = 33.33%
- pv_enterprise_v1: 0/2 = 0.0%
- pv_basic_v3: 0/1 = 0.0%

To test, run your conversion endpoint and verify these numbers match!
*/