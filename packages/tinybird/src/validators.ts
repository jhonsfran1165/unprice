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

export const featureVerificationSchemaV1 = z.object({
  workspaceId: z.string(),
  projectId: z.string(),
  planVersionFeatureId: z.string(),
  featureId: z.string(),
  subscriptionId: z.string(),
  customerId: z.string(),
  planVersionId: z.string(),
  deniedReason: z
    .enum([
      "SUBSCRIPTION_EXPIRED",
      "SUBSCRIPTION_NOT_FOUND",
      "SUBSCRIPTION_NOT_ACTIVE",
      "RATE_LIMITED",
      "USAGE_EXCEEDED",
      "NOT_FOUND",
      "INTERNAL_SERVER_ERROR",
    ])
    .optional(),
  time: z.number(),
  ipAddress: z.string().default(""),
  userAgent: z.string().default(""),
  latency: z.number().optional(),
})

export const auditLogSchemaV1 = z.object({
  /**
   * The workspace owning this audit log
   */
  workspaceId: z.string(),

  /**
   * Buckets are used as namespaces for different logs belonging to a single workspace
   */
  bucket: z.string(),
  auditLogId: z.string(),
  event: z.string(),
  description: z.string().optional(),
  time: z.number(),
  meta: z
    .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
  actor: z.object({
    type: z.string(),
    id: z.string(),
    name: z.string().optional(),
    meta: z
      .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional(),
  }),
  resources: z.array(
    z.object({
      type: z.string(),
      id: z.string(),
      name: z.string().optional(),
      meta: z
        .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
        .optional(),
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

export const payloadPageSchema = z.object({
  session_id: z.string(),
  title: z.string(),
  url: z.string(),
  path: z.string(),
  search: z.string(),
  locale: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  duration: z.number().int(),
  country: z.string().optional().default("Unknown"),
  referer: z.string().optional().default("(direct)"),
  referer_url: z.string().optional().default("(direct)"),
  org_slug: z.string().optional(),
  org_id: z.string().optional(),
  project_slug: z.string().optional(),
})

export const pageSchema = z.object({
  ...payloadPageSchema.shape,
  id: z.string(),
  domain: z.string().optional().default("Unknown"),
  subdomain: z.string().optional().default("Unknown"),
  time: z.number().int(),
  timestamp: z.string().datetime(),
  city: z.string().optional().default("Unknown"),
  region: z.string().optional().default("Unknown"),
  latitude: z.string().optional().default("Unknown"),
  longitude: z.string().optional().default("Unknown"),
  useragent: z.string().optional().default("Unknown"),
  browser: z.string().optional().default("Unknown"),
  browser_version: z.string().optional().default("Unknown"),
  engine: z.string().optional().default("Unknown"),
  engine_version: z.string().optional().default("Unknown"),
  os: z.string().optional().default("Unknown"),
  os_version: z.string().optional().default("Unknown"),
  device: z.string().optional().default("Desktop"),
  device_vendor: z.string().optional().default("Unknown"),
  device_model: z.string().optional().default("Unknown"),
  cpu_architecture: z.string().optional().default("Unknown"),
  bot: z.boolean().optional(),
  ip: z.string().optional().default("Unknown"),
  mobile: z.string().optional().default("Unknown"),
})

export const ClickHitsSchema = z.object({
  id: z.string(),
  key: z.string(),
  domain: z.string().optional().default("Unknown"),
  subdomain: z.string().optional().default("Unknown"),
  time: z.number().int(),
  timestamp: z.string().datetime(),
  country: z.string().optional().default("Unknown"),
  city: z.string().optional().default("Unknown"),
  region: z.string().optional().default("Unknown"),
  latitude: z.string().optional().default("Unknown"),
  longitude: z.string().optional().default("Unknown"),
  useragent: z.string().optional().default("Unknown"),
  browser: z.string().optional().default("Unknown"),
  browser_version: z.string().optional().default("Unknown"),
  engine: z.string().optional().default("Unknown"),
  engine_version: z.string().optional().default("Unknown"),
  os: z.string().optional().default("Unknown"),
  os_version: z.string().optional().default("Unknown"),
  device: z.string().optional().default("Desktop"),
  device_vendor: z.string().optional().default("Unknown"),
  device_model: z.string().optional().default("Unknown"),
  cpu_architecture: z.string().optional().default("Unknown"),
  bot: z.boolean().optional(),
  ip: z.string().optional().default("Unknown"),
  mobile: z.string().optional().default("Unknown"),
})

export const eventSchema = z.object({
  ...payloadEventSchema.shape,
  id: z.string(),
  domain: z.string().optional().default("Unknown"),
  subdomain: z.string().optional().default("Unknown"),
  time: z.number().int(),
  timestamp: z.string().datetime(),
})

export const usageSchema = z.object({
  id: z.string(),
  feature: z.string(),
  metric: z.string(),
  value: z.number(),
  time: z.number().int(),
  timestamp: z.string().datetime(),
  workspaceId: z.string(),
  projectId: z.string(),
})

export type PayloadPageType = z.infer<typeof payloadPageSchema>
export type PayloadEventType = z.infer<typeof payloadEventSchema>
