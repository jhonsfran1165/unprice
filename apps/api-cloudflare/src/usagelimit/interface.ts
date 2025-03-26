import { z } from "zod"
import type { Entitlement } from "~/db/types"

export const reportUsageSchema = z.object({
  customerId: z.string(),
  featureSlug: z.string(),
  usage: z.number(),
  idempotenceKey: z.string(),
  secondsToLive: z.number().optional(),
  timestamp: z.number().optional(),
  projectId: z.string(),
  date: z.number(),
  sync: z.boolean().optional(),
  requestId: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const canSchema = z.object({
  customerId: z.string(),
  featureSlug: z.string(),
  projectId: z.string(),
  requestId: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  secondsToLive: z.number().optional(),
  performanceStart: z.number(),
})

export type ReportUsageRequest = z.infer<typeof reportUsageSchema>
export type CanRequest = z.infer<typeof canSchema>
export const reportUsageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  limit: z.number().optional(),
  usage: z.number().optional(),
  notifyUsage: z.boolean().optional(),
  entitlement: z.custom<Entitlement>().optional(),
})
export type ReportUsageResponse = z.infer<typeof reportUsageResponseSchema>

export interface UsageLimiter {
  reportUsage(req: ReportUsageRequest): Promise<ReportUsageResponse>

  deleteCustomer(
    customerId: string,
    projectId: string
  ): Promise<{
    success: boolean
    message: string
  }>

  can(req: CanRequest): Promise<{
    success: boolean
    message: string
  }>

  revalidateEntitlement(
    customerId: string,
    featureSlug: string,
    projectId: string
  ): Promise<{
    success: boolean
    message: string
  }>
}
