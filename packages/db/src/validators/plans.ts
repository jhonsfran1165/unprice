import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"

export const planSelectBaseSchema = createSelectSchema(schema.plans)

export const planInsertBaseSchema = createInsertSchema(schema.plans, {
  slug: z.string().min(3, "Slug must be at least 3 characters"),
})
  .partial({
    id: true,
    projectId: true,
  })
  .required({
    slug: true,
    paymentProvider: true,
    type: true,
  })

export type InsertPlan = z.infer<typeof planInsertBaseSchema>
