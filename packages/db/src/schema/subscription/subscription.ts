import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { user } from "./subscription.sql"

export const userBase = createSelectSchema(user)

export const userSubscriptionSchema = userBase
  .pick({
    email: true,
    name: true,
    id: true,
  })
  .partial({
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
  })
  .extend({
    projectSlug: z.string(),
  })

export type UserSubscription = z.infer<typeof userSubscriptionSchema>
export type CreateUserSubscription = z.infer<typeof createUserSchema>
export type UpdateUserSubscription = z.infer<typeof updateUserSchema>
