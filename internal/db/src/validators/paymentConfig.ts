import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { paymentProviderConfig } from "../schema/paymentConfig"

export const insertPaymentProviderConfigSchema = createInsertSchema(paymentProviderConfig, {
  key: z.string().min(1),
})

export const selectPaymentProviderConfigSchema = createSelectSchema(paymentProviderConfig)

export type InsertPaymentProviderConfig = z.infer<typeof insertPaymentProviderConfigSchema>
export type PaymentProviderConfig = z.infer<typeof selectPaymentProviderConfigSchema>
