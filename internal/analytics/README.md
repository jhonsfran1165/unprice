https://github.com/tinybirdco/use-case-examples/tree/main/.github/workflows


# usage
`feature_id` String `json:$.feature_id`,
`feature_name` LowCardinality(String) `json:$.feature_name`,
`feature_type` LowCardinality(String) `json:$.feature_type`,
`usage_amount` Float64 `json:$.usage_amount`,
`usage_unit` LowCardinality(String) `json:$.usage_unit`,
`environment` LowCardinality(String) `json:$.environment`,


# verification

  `timestamp` DateTime64(3) `json:$.timestamp`,
  `customer_id` String `json:$.customer_id`,
  `feature_id` String `json:$.feature_id`,
  `feature_name` LowCardinality(String) `json:$.feature_name`,
  `verification_type` LowCardinality(String) `json:$.verification_type`,
  `verification_result` LowCardinality(String) `json:$.verification_result`,
  `request_id` String `json:$.request_id`,
  `subscription_id` String `json:$.subscription_id`,
  `service_tier` LowCardinality(String) `json:$.service_tier`,
  `environment` LowCardinality(String) `json:$.environment`,
  `resource_type` LowCardinality(String) `json:$.resource_type`,
  `resource_id` String `json:$.resource_id`,
  `latency_ms` UInt32 `json:$.latency_ms`,
  `quota_limit` Nullable(Float64) `json:$.quota_limit`,
  `quota_remaining` Nullable(Float64) `json:$.quota_remaining`,
  `error_code` Nullable(String) `json:$.error_code`,
  `error_message` Nullable(String) `json:$.error_message`,
  `metadata` String `json:$.metadata`

# generate sintetic data
https://fiddle.clickhouse.com -> execute the query -> download csv -> import it
tb datasource append unprice_events --file ./fixtures/events.csv