import { z } from "zod"

export const limitRequestSchema = z.object({
  customerId: z.string(),
  featureSlug: z.string(),
  usage: z.number(),
  ttl: z.number().optional(),
})

export type LimitRequest = z.infer<typeof limitRequestSchema>

export const limitResponseSchema = z.object({
  valid: z.boolean(),
  remaining: z.number().optional(),
  usage: z.record(z.string(), z.number()).or(z.object({})).optional(),
})
export type LimitResponse = z.infer<typeof limitResponseSchema>

export const coordinatesResponseSchema = z.object({
  ts: z.number(),
  colo: z.string(),
})
export type CoordinatesResponse = z.infer<typeof coordinatesResponseSchema>

export const coordinatesRequestSchema = z.object({
  keyId: z.string(),
})
export type CoordinatesRequest = z.infer<typeof coordinatesRequestSchema>

export const revalidateRequestSchema = z.object({
  keyId: z.string(),
})
export type RevalidateRequest = z.infer<typeof revalidateRequestSchema>

export interface UsageLimiter {
  reportUsage: (req: LimitRequest) => Promise<LimitResponse>
  revalidate: (req: RevalidateRequest) => Promise<void>
}
