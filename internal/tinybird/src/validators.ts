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
  metadata: z.string().nullable(),
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
  metadata: z.string().nullable(),
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

export const analyticApiSchema = z.object({
  action: z.string().min(1, {
    message: "action is required",
  }),
  eventPayload: z.any(),
})

export const payloadEventSchema = z.object({
  event_name: z.string(),
  session_id: z.string(),
  // Stringified json
  payload: z.any(),
})

export const eventSchema = z.object({
  ...payloadEventSchema.shape,
  id: z.string(),
  domain: z.string().optional().default("Unknown"),
  subdomain: z.string().optional().default("Unknown"),
  time: z.number().int(),
  timestamp: z.string().datetime(),
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

export type GetUsageResponse = z.infer<typeof getUsageResponseSchema>
export type PayloadEventType = z.infer<typeof payloadEventSchema>
