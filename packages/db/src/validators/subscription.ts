import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"
import { planVersionExtendedSchema } from "./planVersions"

export const subscriptionMetadataSchema = z.object({
  externalId: z.string().optional(),
})

const itemSchema = z.object({
  itemType: z.enum(["feature", "addon"]),
  quantity: z.coerce.number().min(1),
  itemId: z.string(),
})

// stripe won't allow more than 250 items in a single invoice
export const subscriptionItemsSchema = z.array(itemSchema).refine((items) => {
  if (items.length > 250) {
    return false
  }
  return true
}, "Total items for the subscription should be less than 250")

export const subscriptionSelectSchema = createSelectSchema(
  schema.subscriptions,
  {
    metadata: subscriptionMetadataSchema,
    items: subscriptionItemsSchema,
  }
)
export const subscriptionInsertSchema = createInsertSchema(
  schema.subscriptions,
  {
    metadata: subscriptionMetadataSchema,
    items: subscriptionItemsSchema,
  }
).partial({
  id: true,
  projectId: true,
})

export const subscriptionExtendedSchema = subscriptionSelectSchema.extend({
  planVersion: planVersionExtendedSchema,
})

export type Subscription = z.infer<typeof subscriptionSelectSchema>
export type InsertSubscription = z.infer<typeof subscriptionInsertSchema>
export type SubscriptionItem = z.infer<typeof itemSchema>
export type SubscriptionExtended = z.infer<typeof subscriptionExtendedSchema>
