import { z } from "zod"

import { tb } from "./client"

export const getFeaturesUsage = tb.buildPipe({
  pipe: "feature_usage_period_v1",
  parameters: z.object({
    projectId: z.string().optional(),
    customerId: z.string().optional(),
    featureSlug: z.string().optional(),
    entitlementId: z.string().optional(),
    start: z.number().optional(),
    end: z.number().optional(),
  }),
  data: z.array(
    z.object({
      projectId: z.string(),
      customerId: z.string(),
      featureSlug: z.string(),
      entitlementId: z.string(),
      total_usage: z.number(),
      max_usage: z.number(),
      event_count: z.number(),
      latest_usage: z.number(),
    })
  ),
})
