import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"

export const customerSelectSchema = createSelectSchema(schema.customers)
export const customerInsertBaseSchema = createInsertSchema(schema.customers, {
  email: z.string().min(3).email(),
  name: z.string().min(3),
})

export const customerSubscriptionSchema = customerSelectSchema.pick({
  email: true,
  name: true,
  id: true,
})

export const customerInsertSchema = customerInsertBaseSchema.partial({
  id: true,
  projectId: true,
})

export const updateCustomerSchema = customerSelectSchema
  .extend({
    email: z.string().email(),
    name: z.string().min(3),
  })
  .pick({
    email: true,
    name: true,
    id: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export type Customer = z.infer<typeof customerSelectSchema>
export type UserSubscription = z.infer<typeof customerSubscriptionSchema>
export type InsertCustomer = z.infer<typeof customerInsertSchema>
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>
