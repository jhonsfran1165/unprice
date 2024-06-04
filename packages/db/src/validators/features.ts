import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import * as schema from "../schema"

export const featureSelectBaseSchema = createSelectSchema(schema.features)

export const featureInsertBaseSchema = createInsertSchema(schema.features, {
  title: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .refine((slug) => /^[a-z0-9-]+$/.test(slug), {
      message: "Slug must be a valid slug",
    }),
})
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .partial({
    id: true,
    projectId: true,
  })

export type InsertFeature = z.infer<typeof featureInsertBaseSchema>
export type Feature = z.infer<typeof featureSelectBaseSchema>
