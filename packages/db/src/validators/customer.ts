import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"
import { PAYMENT_PROVIDERS } from "../utils"

const paymentProviderSchema = z.enum(PAYMENT_PROVIDERS)
const metadataPaymentProviderSchema = z.record(
  paymentProviderSchema,
  z.object({
    customerId: z.string().optional(),
  })
)

export const customerMetadataSchema = z.object({
  metadataPaymentProviderSchema,
  externalId: z.string().optional(),
})

export const customerSelectSchema = createSelectSchema(schema.customers, {
  metadata: customerMetadataSchema,
})

export const customerInsertBaseSchema = createInsertSchema(schema.customers, {
  metadata: customerMetadataSchema,

  email: z.string().min(3).email(),
  name: z.string().min(3),
}).partial({
  id: true,
  projectId: true,
})

export type Customer = z.infer<typeof customerSelectSchema>
export type InsertCustomer = z.infer<typeof customerInsertBaseSchema>
