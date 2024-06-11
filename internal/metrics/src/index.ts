import { z } from "zod"

export const metricSchema = z.discriminatedUnion("metric", [
  z.object({
    metric: z.literal("metric.cache.read"),
    key: z.string(),
    hit: z.boolean(),
    status: z.enum(["fresh", "stale"]).optional(),
    latency: z.number(),
    tier: z.string(),
    namespace: z.string(),
  }),
  z.object({
    metric: z.literal("metric.cache.write"),
    key: z.string(),
    tier: z.string(),
    latency: z.number(),
    namespace: z.string(),
  }),
  z.object({
    metric: z.literal("metric.cache.remove"),
    key: z.string(),
    tier: z.string(),
    namespace: z.string(),
    latency: z.number(),
  }),
  z.object({
    metric: z.literal("metric.feature.verification"),
    valid: z.boolean(),
    code: z.string(),
    customerId: z.string().optional(),
    apiId: z.string().optional(),
    featureSlug: z.string().optional(),
    duration: z.number(),
    service: z.string(),
  }),
  z.object({
    metric: z.literal("metric.http.request"),
    path: z.string(),
    method: z.string(),
    status: z.number(),
    error: z.string().optional(),
    duration: z.number(),
    continent: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    userAgent: z.string().optional(),
    fromAgent: z.string().optional(),
    service: z.string(),
  }),
  z.object({
    metric: z.literal("metric.db.read"),
    query: z.enum(["subscriptionFeatureBySlug"]),
    duration: z.number(),
    service: z.string(),
  }),
])

export type Metric = z.infer<typeof metricSchema>
