import * as z from "zod"

import { PAYMENT_PROVIDERS } from "../utils"

export const paymentProviderSchema = z.enum(PAYMENT_PROVIDERS)

export type PaymentProvider = z.infer<typeof paymentProviderSchema>
