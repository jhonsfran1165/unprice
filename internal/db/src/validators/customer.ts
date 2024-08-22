import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"
import { currencySchema } from "./shared"
import { subscriptionItemsConfigSchema } from "./subscriptions/items"

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
    createdAtM: true,
    updatedAtM: true,
  })
  .partial({
    id: true,
    projectId: true,
  })

export const customerSignUpSchema = customerInsertBaseSchema
  .partial()
  .required({
    email: true,
  })
  .extend({
    planVersionId: z.string().min(1, "Plan version is required"),
    config: subscriptionItemsConfigSchema.optional(),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
  })

export const stripeSetupSchema = z.object({
  id: z.string().min(1, "Customer id is required"),
  name: z.string().optional(),
  email: z.string().email(),
  currency: currencySchema,
  timezone: z.string().min(1, "Timezone is required"),
  projectId: z.string().min(1, "Project id is required"),
})

export type Customer = z.infer<typeof customerSelectSchema>
export type InsertCustomer = z.infer<typeof customerInsertBaseSchema>
export type StripeSetup = z.infer<typeof stripeSetupSchema>
export type CustomerSignUp = z.infer<typeof customerSignUpSchema>
