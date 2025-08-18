export const featureUsageSchema = {
  subscriptionItemId: {
    type: "string.uuid",
  },
  subscriptionPhaseId: {
    type: "string.uuid",
  },
  subscriptionId: {
    type: "string.uuid",
  },
  entitlementId: {
    type: "mockingbird.pick",
    params: [
      {
        values: [
          "00f8b203-63f7-495f-9395-afa4c3bc7624",
          "8965d539-6fee-44e2-90ac-3c8ef6d8c4aa",
          "33796ab5-4347-452b-81a5-129cac6eea67",
        ],
      },
    ],
  },
  customerId: {
    type: "mockingbird.pick",
    params: [
      {
        values: [
          "12003599-74ee-4be3-90be-6c8b9da6b9e7",
          "c0a2ed9d-f573-4a79-a87b-d7eda2d26a58",
          "38b1408d-a99d-402a-9ec2-709e97ddc92e",
        ],
      },
    ],
  },
  projectId: {
    type: "mockingbird.pick",
    params: [
      {
        values: [
          "95dd543d-ebbb-4d15-b3f8-553efb2b7e45",
          "20d2096f-eed2-4bf4-b132-e412a598fa00",
          "486bc0f8-357b-4387-acd5-42cb4d9d507f",
        ],
      },
    ],
  },
  planVersionFeatureId: {
    type: "string.uuid",
  },
  workspaceId: {
    type: "string.uuid",
  },
  requestId: {
    type: "string.uuid",
  },
  deleted: {
    type: "mockingbird.pickWeighted",
    params: [
      {
        values: [false, true],
        weights: [95, 5],
      },
    ],
  },
  featureSlug: {
    type: "mockingbird.pick",
    params: [
      {
        values: ["feature_1", "feature_2", "feature_3"],
      },
    ],
  },
  usage: {
    type: "number.int",
    params: [
      {
        min: -10,
        max: 100,
      },
    ],
  },
  timestamp: {
    type: "number.int",
    params: [
      {
        min: 1707288000000, // 2024-02-07
        max: 1707892800000, // 2024-02-15
      },
    ],
  },
  createdAt: {
    type: "number.int",
    params: [
      {
        min: 1707288000000, // 2024-02-07
        max: 1707892800000, // 2024-02-15
      },
    ],
  },
  metadata: {
    type: "mockingbird.pickWeighted",
    params: [
      {
        values: [
          JSON.stringify({ user_id: 1 }),
          JSON.stringify({ user_id: 2 }),
          JSON.stringify({ user_id: 3 }),
        ],
        weights: [30, 40, 30],
      },
    ],
  },
}

export const analyticsEventsSchema = {
  timestamp: {
    type: "mockingbird.timestampNow",
  },
  session_id: {
    type: "string.uuid",
  },
  action: {
    type: "string",
  },
  payload: {
    type: "mockingbird.pick",
    params: [
      {
        values: [
          '{"customer_id":"cus_123","plan_version_id":"pv_123","page_id":"page_123","status":"signup_success"}',
          '{"customer_id":"cus_123","plan_version_id":"pv_123","page_id":"page_123","status":"signup_failed"}',
          '{"customer_id":"cus_123","plan_version_id":"pv_123","page_id":"page_123","status":"waiting_payment_provider_setup"}',
          '{"customer_id":"cus_456","plan_version_id":"pv_456","page_id":"page_456","status":"signup_success"}',
          '{"customer_id":"cus_789","plan_version_id":"pv_789","page_id":"page_789","status":"signup_success"}',
          '{"customer_id":"cus_101","plan_version_id":"pv_101","page_id":"page_101","status":"signup_success"}',
        ],
      },
    ],
  },
}
