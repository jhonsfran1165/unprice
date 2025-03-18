import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import * as schema from "../schema"
import { deniedReasonSchema, typeFeatureSchema, unpriceCustomerErrorSchema } from "./shared"

export const featureSelectBaseSchema = createSelectSchema(schema.features)

export const featureInsertBaseSchema = createInsertSchema(schema.features, {
  title: z
    .string()
    .min(1)
    .max(50)
    .refine((title) => /^[a-zA-Z0-9\s]+$/.test(title), {
      message: "Title must contain only letters, numbers, and spaces",
    }),
  slug: z
    .string()
    .min(1)
    .refine((slug) => /^[a-z0-9-]+$/.test(slug), {
      message: "Slug must be a valid slug",
    }),
})
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })
  .partial({
    id: true,
    projectId: true,
  })

export type InsertFeature = z.infer<typeof featureInsertBaseSchema>
export type Feature = z.infer<typeof featureSelectBaseSchema>

export const featureVerificationSchema = z.object({
  access: z.boolean(),
  deniedReason: z.union([deniedReasonSchema, unpriceCustomerErrorSchema]).optional(),
  currentUsage: z.number().optional(),
  limit: z.number().optional(),
  featureType: typeFeatureSchema.optional(),
  units: z.number().optional(),
  message: z.string().optional(),
})

export type FeatureVerification = z.infer<typeof featureVerificationSchema>
