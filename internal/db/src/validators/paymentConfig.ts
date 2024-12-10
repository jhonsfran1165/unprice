import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { paymentProviderConfig } from "../schema/paymentConfig"
import { paymentProviderSchema } from "./shared"

export const insertPaymentProviderConfigSchema = createInsertSchema(paymentProviderConfig, {
  key: z.string().min(1),
  paymentProvider: paymentProviderSchema,
})
  .required({
    paymentProvider: true,
    active: true,
    key: true,
  })
  .partial({
    projectId: true,
    createdAtM: true,
    updatedAtM: true,
    id: true,
  })

export const selectPaymentProviderConfigSchema = createSelectSchema(paymentProviderConfig)

export type InsertPaymentProviderConfig = z.infer<typeof insertPaymentProviderConfigSchema>
export type PaymentProviderConfig = z.infer<typeof selectPaymentProviderConfigSchema>
