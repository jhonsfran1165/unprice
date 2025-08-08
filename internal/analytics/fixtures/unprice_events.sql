SELECT
    now() - randUniform(0, 86400) AS timestamp,
    ['session_12345', 'session_67890', 'session_10101', 'session_12121'][(rand() % 4) + 1] AS session_id,
    ['signup', 'plan_click'][(rand() % 2) + 1] AS action,
    concat('1') AS version,
    multiIf(
        action = 'signup',
        concat('{',
            '"customer_id":"', if(rand() % 2 = 0, ['cus_starter_101', 'cus_pro_102', 'cus_enterprise_103', 'cus_basic_104'][(rand() % 4) + 1], 'anonymous'), '",',
            '"plan_version_id":"', ['pv_starter_v1', 'pv_pro_v2', 'pv_enterprise_v1', 'pv_basic_v3', 'pv_starter_v2', 'pv_pro_v3', 'pv_enterprise_v4', 'pv_basic_v5'][(rand() % 8) + 1], '",',
            '"page_id":', if(rand() % 3 = 0, 'null', concat('"', ['page_landing', 'page_pricing', 'page_signup', 'page_checkout'][(rand() % 4) + 1], '"')), ',',
            '"status":"', ['signup_success', 'signup_failed', 'waiting_payment_provider_setup'][(rand() % 3) + 1], '"',
            '}'),
        action = 'plan_click',
        concat('{',
            '"plan_version_id":"', ['pv_starter_v1', 'pv_pro_v2', 'pv_enterprise_v1', 'pv_basic_v3', 'pv_starter_v2', 'pv_pro_v3', 'pv_enterprise_v4', 'pv_basic_v5'][(rand() % 8) + 1], '",',
            '"page_id":"', ['page_landing', 'page_pricing', 'page_signup', 'page_checkout'][(rand() % 4) + 1], '"',
            '}'),
        '{}'
    ) AS payload
FROM numbers(50)