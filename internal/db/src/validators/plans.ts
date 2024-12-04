import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"

export const planMetadataSchema = z.object({
  externalId: z.string().optional(),
})

export const planSelectBaseSchema = createSelectSchema(schema.plans, {
  metadata: planMetadataSchema,
})

export const planInsertBaseSchema = createInsertSchema(schema.plans, {
  metadata: planMetadataSchema,
  slug: z.string().min(3, "Slug must be at least 3 characters"),
})
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })
  .partial({
    id: true,
    projectId: true,
  })
  .required({
    slug: true,
  })

export type InsertPlan = z.infer<typeof planInsertBaseSchema>
export type Plan = z.infer<typeof planSelectBaseSchema>
