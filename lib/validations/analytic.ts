import * as z from "zod"

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

export const payloadPageViewSchema = z.object({
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

export const pageViewSchema = z.object({
  ...payloadPageViewSchema.shape,
  id: z.string(),
  domain: z.string().optional().default("Unknown"),
  subdomain: z.string().optional().default("Unknown"),
  time: z.number().int(),
  timestamp: z.string(),
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
  timestamp: z.string(),
})

// Infer type for typescript
export type PayloadPageViewType = z.infer<typeof payloadPageViewSchema>
export type PayloadEventType = z.infer<typeof payloadEventSchema>
