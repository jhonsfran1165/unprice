import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { schema } from "@builderai/db"

export const userBase = createSelectSchema(schema.user)
export const subscriptionBase = createSelectSchema(schema.subscription)

export const createSubscriptionSchema = subscriptionBase
  .pick({
    planVersion: true,
    userId: true,
    planId: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export const userSubscriptionSchema = userBase.pick({
  email: true,
  name: true,
  id: true,
})

export const createUserSchema = userBase
  .extend({
    email: z.string().email(),
    name: z.string().min(3),
  })
  .pick({
    email: true,
    name: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export const updateUserSchema = userBase
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

export type User = z.infer<typeof userBase>
export type Subscription = z.infer<typeof subscriptionBase>
export type CreateSubscription = z.infer<typeof createSubscriptionSchema>
export type UserSubscription = z.infer<typeof userSubscriptionSchema>
export type CreateUserSubscription = z.infer<typeof createUserSchema>
export type UpdateUserSubscription = z.infer<typeof updateUserSchema>
