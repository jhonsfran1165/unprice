import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { schema } from "@builderai/db"

export const subscriptionSelectSchema = createSelectSchema(schema.subscription)
export const subscriptionInsertSchema = createInsertSchema(schema.subscription)

export const createSubscriptionSchema = subscriptionSelectSchema
  .pick({
    planVersionId: true,
    customerId: true,
    planId: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export type Subscription = z.infer<typeof subscriptionSelectSchema>
export type CreateSubscription = z.infer<typeof createSubscriptionSchema>
