import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type * as z from "zod"

import * as schema from "../schema"

export const planSelectBaseSchema = createSelectSchema(schema.plans)
export const planInsertBaseSchema = createInsertSchema(schema.plans)

export const insertPlanSchema = planSelectBaseSchema.partial({
  id: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  startCycle: true,
  gracePeriod: true,
  active: true,
})

export const updatePlanSchema = planSelectBaseSchema
  .pick({
    slug: true,
    id: true,
    content: true,
    projectId: true,
    title: true,
  })
  .partial({
    slug: true,
  })

export type InsertPlan = z.infer<typeof insertPlanSchema>
export type UpdatePlan = z.infer<typeof updatePlanSchema>
