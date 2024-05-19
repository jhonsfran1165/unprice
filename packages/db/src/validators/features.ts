import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import * as schema from "../schema"

// TODO: move this to api validator file
// enum for all possible reasons a feature verification can be denied
export const deniedReasonSchema = z.enum([
  "RATE_LIMITED",
  "USAGE_EXCEEDED",
  "FEATURE_TYPE_NOT_SUPPORTED",
])

export const apiErrorSchema = z.enum([
  "SUBSCRIPTION_EXPIRED",
  "SUBSCRIPTION_NOT_ACTIVE",
  "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
  "CUSTOMER_HAS_NO_SUBSCRIPTION",
  "CUSTOMER_NOT_FOUND",
])

export const reportUsageErrorSchema = z.enum(["FEATURE_IS_NOT_USAGE_TYPE"])

export const featureSelectBaseSchema = createSelectSchema(schema.features)

export const featureInsertBaseSchema = createInsertSchema(schema.features, {
  title: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .refine((slug) => /^[a-z0-9-]+$/.test(slug), {
      message: "Slug must be a valid slug",
    }),
}).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  projectId: true,
})

export type InsertFeature = z.infer<typeof featureInsertBaseSchema>
export type Feature = z.infer<typeof featureSelectBaseSchema>
export type FeatureDenyReason = z.infer<typeof deniedReasonSchema>
export type FeatureReportUsageError = z.infer<typeof reportUsageErrorSchema>
export type ApiError = z.infer<typeof apiErrorSchema>
