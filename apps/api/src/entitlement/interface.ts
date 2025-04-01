import type { FetchError } from "@unprice/error"
import type { Result } from "@unprice/error"
import type { UnPriceCustomerError } from "@unprice/services/customers"
import { z } from "zod"

export const reportUsageSchema = z.object({
  customerId: z.string(),
  featureSlug: z.string(),
  usage: z.number(),
  idempotenceKey: z.string(),
  secondsToLive: z.number().optional(),
  timestamp: z.number(),
  projectId: z.string(),
  now: z.number().default(Date.now()),
  sync: z.boolean().optional(),
  requestId: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const canSchema = z.object({
  now: z.number(),
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
  entitlementNotFound: z.boolean().optional(),
})
export type ReportUsageResponse = z.infer<typeof reportUsageResponseSchema>

export interface EntitlementLimiter {
  reportUsage(req: ReportUsageRequest): Promise<ReportUsageResponse>

  resetEntitlements(
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
    projectId: string,
    now: number
  ): Promise<Result<void, FetchError | UnPriceCustomerError>>
}
