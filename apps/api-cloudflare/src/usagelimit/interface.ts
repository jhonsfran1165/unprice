import { z } from "zod"

export const reportUsageSchema = z.object({
  customerId: z.string(),
  featureSlug: z.string(),
  usage: z.number(),
  idempotenceKey: z.string(),
  ttl: z.number().optional(),
  timestamp: z.number().optional(),
  projectId: z.string(),
  date: z.number(),
})

export type ReportUsageRequest = z.infer<typeof reportUsageSchema>

export const reportUsageResponseSchema = z.object({
  valid: z.boolean(),
  message: z.string().optional(),
  remaining: z.number().optional(),
})
export type ReportUsageResponse = z.infer<typeof reportUsageResponseSchema>

export const revalidateRequestSchema = z.object({
  customerId: z.string(),
  featureSlug: z.string(),
})
export type RevalidateRequest = z.infer<typeof revalidateRequestSchema>

export interface UsageLimiter {
  reportUsage: (req: ReportUsageRequest) => Promise<ReportUsageResponse>
  revalidate: (req: RevalidateRequest) => Promise<void>
}
