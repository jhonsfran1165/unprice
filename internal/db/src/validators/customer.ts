import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"

export const customerMetadataSchema = z.object({
  externalId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripeDefaultPaymentMethodId: z.string().optional(),
})

export const customerSelectSchema = createSelectSchema(schema.customers, {
  metadata: customerMetadataSchema,
  timezone: z.string().min(1),
})

export const customerInsertBaseSchema = createInsertSchema(schema.customers, {
  metadata: customerMetadataSchema,
  email: z.string().min(3).email(),
  name: z.string().min(3),
  timezone: z.string().min(1),
})
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .partial({
    id: true,
    projectId: true,
  })

export type Customer = z.infer<typeof customerSelectSchema>
export type InsertCustomer = z.infer<typeof customerInsertBaseSchema>
