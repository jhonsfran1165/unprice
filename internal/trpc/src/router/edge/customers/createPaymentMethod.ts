import { TRPCError } from "@trpc/server"
import {
  createPaymentMethodResponseSchema,
  createPaymentMethodSchema,
} from "@unprice/db/validators"
import { protectedProjectProcedure } from "#trpc"
import { unprice } from "#utils/unprice"

export const createPaymentMethod = protectedProjectProcedure
  .input(createPaymentMethodSchema)
  .output(createPaymentMethodResponseSchema)
  .mutation(async (opts) => {
    const { successUrl, cancelUrl, customerId, paymentProvider } = opts.input

    const response = await unprice.customers.createPaymentMethod({
      successUrl,
      cancelUrl,
      customerId,
      paymentProvider,
    })

    if (response.error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: response.error.message,
      })
    }

    return response.result
  })
