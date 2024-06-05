import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"
import { paymentProviderSchema } from "./shared"

export const customerProvidersMetadataSchema = z.object({
  externalId: z.string().optional(),
})

export const customerMetadataSchema = z.object({
  externalId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
})

export const customerPaymentProviderSelectSchema = createSelectSchema(
  schema.customerPaymentProviders,
  {
    metadata: customerProvidersMetadataSchema,
    paymentProvider: paymentProviderSchema,
  }
)

export const customerPaymentProviderInsertSchema = createInsertSchema(
  schema.customerPaymentProviders,
  {
    metadata: customerProvidersMetadataSchema,
    paymentProvider: paymentProviderSchema,
  }
)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .partial({
    id: true,
    projectId: true,
  })

export const customerSelectSchema = createSelectSchema(schema.customers, {
  metadata: customerMetadataSchema,
})

export const customerInsertBaseSchema = createInsertSchema(schema.customers, {
  metadata: customerMetadataSchema,
  email: z.string().min(3).email(),
  name: z.string().min(3),
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

export type CustomerPaymentProvider = z.infer<typeof customerPaymentProviderSelectSchema>
export type InsertCustomerPaymentProvider = z.infer<typeof customerPaymentProviderInsertSchema>
