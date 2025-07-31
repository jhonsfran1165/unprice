import * as z from "zod"

export type MaybeArray<T> = T | T[]

/**
 * `t` has the format `2021-01-01 00:00:00`
 *
 * If we transform it as is, we get `1609459200000` which is `2021-01-01 01:00:00` due to fun timezone stuff.
 * So we split the string at the space and take the date part, and then parse that.
 */
export const dateToUnixMilli = z
  .string()
  .transform((t) => new Date(t.split(" ").at(0) ?? t).getTime())

export const datetimeToUnixMilli = z.string().transform((t) => new Date(t).getTime())

export const unixMilliToDate = z.number().transform((d) => {
  const date = new Date(d)
  // always use UTC
  date.setUTCHours(0, 0, 0, 0)
  return date.getTime()
})

export const jsonToNullableString = z.string().transform((s) => {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
})

export const anyObject = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))

export const nullableJsonToString = anyObject.nullable().transform((s) => {
  if (s === null) return null
  try {
    return JSON.stringify(s)
  } catch {
    return null
  }
})

export const stringToUInt32 = z.union([z.string(), z.number()]).transform((s) => Number(s))
export const booleanToUInt8 = z.boolean().transform((b) => (b ? 1 : 0))

export const metadataSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .nullable()
  .transform((m) => {
    // tinybird receives a Map<string, string>
    const transformed = m
      ? Object.fromEntries(Object.entries(m).map(([key, value]) => [key, value?.toString() ?? ""]))
      : null

    return transformed
  })

export const featureVerificationSchemaV1 = z.object({
  projectId: z.string(),
  featurePlanVersionId: z.string(),
  subscriptionItemId: z.string().nullable(),
  subscriptionPhaseId: z.string().nullable(),
  subscriptionId: z.string().nullable(),
  entitlementId: z.string(),
  deniedReason: z.string().optional(),
  timestamp: z
    .number()
    .default(Date.now())
    .describe("timestamp of when this usage record should be billed"),
  createdAt: z
    .number()
    .default(Date.now())
    .describe("timestamp of when this usage record was created"),
  latency: z.number().optional(),
  featureSlug: z.string(),
  customerId: z.string(),
  requestId: z.string(),
  metadata: metadataSchema,
})

export const featureUsageSchemaV1 = z.object({
  idempotenceKey: z.string(),
  subscriptionItemId: z.string().nullable(),
  subscriptionPhaseId: z.string().nullable(),
  subscriptionId: z.string().nullable(),
  entitlementId: z.string(),
  featureSlug: z.string(),
  customerId: z.string(),
  timestamp: z
    .number()
    .default(Date.now())
    .describe("timestamp of when this usage record should be billed"),
  projectId: z.string(),
  featurePlanVersionId: z.string(),
  usage: stringToUInt32,
  createdAt: z
    .number()
    .default(Date.now())
    .describe("timestamp of when this usage record was created"),
  requestId: z.string(),
  deleted: z.number().int().min(0).max(1).default(0),
  metadata: metadataSchema,
})

export const auditLogSchemaV1 = z.object({
  workspaceId: z.string(),
  auditLogId: z.string(),
  event: z.string(),
  description: z.string().optional(),
  time: z.number(),
  meta: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  actor: z.object({
    type: z.string(),
    id: z.string(),
    name: z.string().optional(),
    meta: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  }),
  resources: z.array(
    z.object({
      type: z.string(),
      id: z.string(),
      name: z.string().optional(),
      meta: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    })
  ),
  context: z.object({
    location: z.string(),
    userAgent: z.string().optional(),
  }),
})

export const getAnalyticsVerificationsResponseSchema = z.object({
  projectId: z.string(),
  customerId: z.string().optional(),
  entitlementId: z.string().optional(),
  featureSlug: z.string(),
  count: z.number(),
  p95_latency: z.number(),
  max_latency: z.number(),
  latest_latency: z.number(),
})

export const getUsageResponseSchema = z.object({
  projectId: z.string(),
  customerId: z.string().optional(),
  entitlementId: z.string().optional(),
  featureSlug: z.string(),
  count: z.number(),
  sum: z.number(),
  max: z.number(),
  last_during_period: z.number(),
})

export const schemaPageHit = z.object({
  session_id: z.string().optional(),
  page_id: z.string(),
  plan_ids: z.string().optional(),
  locale: z.string(),
  referrer: z.string(),
  pathname: z.string(),
  url: z.string(),
})

export const schemaPlanClick = z.object({
  plan_version_id: z.string(),
  plan_slug: z.string(),
  plan_version: z.string(),
  page_id: z.string(),
})

export const schemaSignUp = z.object({
  customer_id: z.string(),
  plan_version_id: z.string(),
  page_id: z.string().nullable(),
  status: z.enum(["waiting_payment_provider", "signup_failed", "signup_success"]),
})

export const analyticsEventBaseSchema = z.object({
  timestamp: z.string().datetime(),
  session_id: z.string().nullable(),
})

export const analyticsEventSchema = z
  .discriminatedUnion("action", [
    z.object({
      action: z.literal("sign_up"),
      version: z.string(),
      ...analyticsEventBaseSchema.shape,
      payload: schemaSignUp,
    }),
    z.object({
      action: z.literal("plan_click"),
      version: z.string(),
      ...analyticsEventBaseSchema.shape,
      payload: schemaPlanClick,
    }),
    z.object({
      action: z.literal("page_hit"),
      version: z.string(),
      ...analyticsEventBaseSchema.shape,
      payload: schemaPageHit,
    }),
  ])
  .transform((event) => {
    return {
      ...event,
      payload: JSON.stringify(event.payload),
    }
  })

export const pageEventSchema = z.object({
  ...analyticsEventBaseSchema.shape,
  page_id: z.string(),
  plan_ids: z.array(z.string()).nullable(),
  url: z.string(),
  country: z.string(),
  city: z.string(),
  region: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  device: z.string(),
  device_model: z.string(),
  device_vendor: z.string(),
  browser: z.string(),
  browser_version: z.string(),
  os: z.string(),
  os_version: z.string(),
  engine: z.string(),
  engine_version: z.string(),
  cpu_architecture: z.string(),
  ua: z.string(),
  bot: z.boolean(),
  referrer: z.string(),
  referrer_url: z.string(),
  ip: z.string(),
  continent: z.string(),
  locale: z.string(),
})

export const schemaPlanVersion = z.object({
  id: z.string(),
  project_id: z.string(),
  plan_id: z.string(),
  plan_slug: z.string(),
  plan_version: z.number(),
  currency: z.string(),
  payment_provider: z.string(),
  billing_interval: z.string(),
  billing_interval_count: z.number(),
  billing_anchor: z.string(),
  plan_type: z.string(),
  trial_days: z.number(),
  payment_method_required: z.boolean(),
  timestamp: z.string().datetime(),
})

export type PageAnalyticsEvent = z.infer<typeof pageEventSchema>
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>
export type GetUsageResponse = z.infer<typeof getUsageResponseSchema>

// Plan conversion response schemas
export const planConversionResponseSchema = z.object({
  date: z.string(),
  plan_id: z.string(),
  plan_slug: z.string().nullable(),
  plan_version: z.string().nullable(),
  page_id: z.string().nullable(),
  page_views: z.number(),
  clicks: z.number(),
  conversions: z.number(),
  conversion_rate: z.number(),
  click_through_rate: z.number(),
  overall_conversion_rate: z.number(),
})

export type PlanConversionResponse = z.infer<typeof planConversionResponseSchema>
