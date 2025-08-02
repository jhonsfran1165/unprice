-- Verification queries to test the conversion funnel endpoint results
-- Run these after loading the test data to verify the endpoint is working correctly

-- 1. Check raw data counts
SELECT 'Raw Data Verification' as test_type;

SELECT
    'Page Hits Count' as metric,
    count() as value
FROM unprice_page_hits
WHERE session_id IN ('session_conversion_1', 'session_conversion_2', 'session_conversion_3',
                     'session_conversion_4', 'session_no_click', 'session_click_no_signup');

SELECT
    'Events Count' as metric,
    count() as value
FROM unprice_events
WHERE session_id IN ('session_conversion_1', 'session_conversion_2', 'session_conversion_3',
                     'session_conversion_4', 'session_no_click', 'session_click_no_signup');

-- 2. Check plan views aggregation (should match the materialized view)
SELECT 'Plan Views by Plan Version' as test_type;

SELECT
    plan_version_id,
    uniq(session_id) as unique_views,
    count() as total_views
FROM unprice_page_hits
ARRAY JOIN plan_ids as plan_version_id
WHERE session_id IN ('session_conversion_1', 'session_conversion_2', 'session_conversion_3',
                     'session_conversion_4', 'session_no_click', 'session_click_no_signup')
  AND plan_version_id IS NOT NULL AND plan_version_id != ''
GROUP BY plan_version_id
ORDER BY plan_version_id;

-- 3. Check plan clicks aggregation
SELECT 'Plan Clicks by Plan Version' as test_type;

SELECT
    JSONExtractString(payload, 'plan_version_id') as plan_version_id,
    uniq(session_id) as unique_clicks,
    count() as total_clicks
FROM unprice_events
WHERE action = 'plan_click'
  AND session_id IN ('session_conversion_1', 'session_conversion_2', 'session_conversion_3',
                     'session_conversion_4', 'session_no_click', 'session_click_no_signup')
  AND JSONExtractString(payload, 'plan_version_id') != ''
GROUP BY plan_version_id
ORDER BY plan_version_id;

-- 4. Check signup status aggregation
SELECT 'Signups by Plan Version and Status' as test_type;

SELECT
    JSONExtractString(payload, 'plan_version_id') as plan_version_id,
    JSONExtractString(payload, 'status') as status,
    count() as signup_count
FROM unprice_events
WHERE action = 'signup'
  AND session_id IN ('session_conversion_1', 'session_conversion_2', 'session_conversion_3',
                     'session_conversion_4', 'session_no_click', 'session_click_no_signup')
  AND JSONExtractString(payload, 'plan_version_id') != ''
GROUP BY plan_version_id, status
ORDER BY plan_version_id, status;

-- 5. Expected vs Actual Conversion Summary
SELECT 'Expected Conversion Results' as test_type;

WITH expected_results AS (
    SELECT 'pv_starter_v1' as plan_version_id, 2 as expected_views, 1 as expected_clicks, 1 as expected_signups, 50.0 as expected_conversion
    UNION ALL SELECT 'pv_pro_v2', 3, 2, 1, 33.33
    UNION ALL SELECT 'pv_enterprise_v1', 2, 1, 0, 0.0
    UNION ALL SELECT 'pv_basic_v3', 1, 1, 0, 0.0
)
SELECT
    plan_version_id,
    expected_views,
    expected_clicks,
    expected_signups,
    expected_conversion
FROM expected_results
ORDER BY plan_version_id;

-- 6. Test query that mimics the endpoint logic (simplified version)
SELECT 'Simulated Endpoint Results' as test_type;

WITH plan_views AS (
    SELECT
        toDate(timestamp) AS date,
        plan_version_id,
        page_id,
        uniq(session_id) AS unique_views,
        count() AS total_views
    FROM unprice_page_hits
    ARRAY JOIN plan_ids as plan_version_id
    WHERE session_id IN ('session_conversion_1', 'session_conversion_2', 'session_conversion_3',
                         'session_conversion_4', 'session_no_click', 'session_click_no_signup')
      AND plan_version_id IS NOT NULL AND plan_version_id != ''
    GROUP BY date, plan_version_id, page_id
),
plan_clicks AS (
    SELECT
        toDate(timestamp) AS date,
        JSONExtractString(payload, 'plan_version_id') as plan_version_id,
        JSONExtractString(payload, 'page_id') as page_id,
        uniq(session_id) AS unique_clicks,
        count() AS total_clicks
    FROM unprice_events
    WHERE action = 'plan_click'
      AND session_id IN ('session_conversion_1', 'session_conversion_2', 'session_conversion_3',
                         'session_conversion_4', 'session_no_click', 'session_click_no_signup')
      AND JSONExtractString(payload, 'plan_version_id') != ''
    GROUP BY date, plan_version_id, page_id
),
plan_signups AS (
    SELECT
        toDate(timestamp) as date,
        JSONExtractString(payload, 'plan_version_id') as plan_version_id,
        JSONExtractString(payload, 'page_id') as page_id,
        countIf(JSONExtractString(payload, 'status') = 'signup_success') as signups_completed,
        countIf(JSONExtractString(payload, 'status') = 'waiting_payment_provider_setup') as signups_pending,
        countIf(JSONExtractString(payload, 'status') = 'signup_failed') as signups_failed
    FROM unprice_events
    WHERE action = 'signup'
      AND session_id IN ('session_conversion_1', 'session_conversion_2', 'session_conversion_3',
                         'session_conversion_4', 'session_no_click', 'session_click_no_signup')
      AND JSONExtractString(payload, 'plan_version_id') != ''
    GROUP BY date, plan_version_id, page_id
)
SELECT
    v.plan_version_id as plan_version_id,
    sum(v.unique_views) as plan_views,
    sum(ifNull(c.unique_clicks, 0)) as plan_clicks,
    sum(ifNull(s.signups_completed, 0)) as plan_signups,
    if(sum(v.unique_views) > 0,
       sum(ifNull(s.signups_completed, 0)) / sum(v.unique_views) * 100, 0) as conversion_rate
FROM plan_views v
LEFT JOIN plan_clicks c ON v.date = c.date AND v.plan_version_id = c.plan_version_id AND v.page_id = c.page_id
LEFT JOIN plan_signups s ON v.date = s.date AND v.plan_version_id = s.plan_version_id AND v.page_id = s.page_id
GROUP BY v.plan_version_id
ORDER BY v.plan_version_id;