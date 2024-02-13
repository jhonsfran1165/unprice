import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { schema } from "@builderai/db"

export const customerSelectSchema = createSelectSchema(schema.customers)
export const customerInsertBaseSchema = createInsertSchema(schema.customers, {
  email: z.string().email(),
  name: z.string().min(3),
})

export const customerSubscriptionSchema = customerSelectSchema.pick({
  email: true,
  name: true,
  id: true,
})

export const customerInsertSchema = customerInsertBaseSchema
  .pick({
    email: true,
    name: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export const updateUserSchema = customerSelectSchema
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

export type User = z.infer<typeof customerSelectSchema>
export type UserSubscription = z.infer<typeof customerSubscriptionSchema>
export type CreateUserSubscription = z.infer<typeof customerInsertSchema>
export type UpdateUserSubscription = z.infer<typeof updateUserSchema>
