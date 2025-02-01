import { AesGCM } from "@unprice/db/utils"
import { paymentProviderSchema } from "@unprice/db/validators"
import { z } from "zod"
import { PaymentProviderService } from "#services/payment-provider"

import { TRPCError } from "@trpc/server"
import { env } from "#env.mjs"
import { protectedApiOrActiveProjectProcedure } from "#trpc"

export const listPaymentMethods = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.listPaymentMethods",
    openapi: {
      method: "GET",
      path: "/edge/customers.listPaymentMethods",
      protect: true,
    },
  })
  .input(
    z.object({
      customerId: z.string(),
      provider: paymentProviderSchema,
      projectSlug: z.string().optional(),
    })
  )
  .output(
    z.object({
      paymentMethods: z
        .object({
          id: z.string(),
          name: z.string().nullable(),
          last4: z.string().optional(),
          expMonth: z.number().optional(),
          expYear: z.number().optional(),
          brand: z.string().optional(),
        })
        .array(),
    })
  )
  .query(async (opts) => {
    const { customerId, provider } = opts.input
    const project = opts.ctx.project

    const customerData = await opts.ctx.db.query.customers.findFirst({
      where: (customer, { and, eq }) =>
        and(eq(customer.id, customerId), eq(customer.projectId, project.id)),
    })

    if (!customerData) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Customer not found",
      })
    }

    // get config payment provider
    const config = await opts.ctx.db.query.paymentProviderConfig.findFirst({
      where: (config, { and, eq }) =>
        and(
          eq(config.projectId, project.id),
          eq(config.paymentProvider, provider),
          eq(config.active, true)
        ),
    })

    if (!config) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment provider config not found or not active",
      })
    }

    const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

    const decryptedKey = await aesGCM.decrypt({
      iv: config.keyIv,
      ciphertext: config.key,
    })

    try {
      const paymentProviderService = new PaymentProviderService({
        customer: customerData,
        logger: opts.ctx.logger,
        paymentProvider: provider,
        token: decryptedKey,
      })

      const customerId = paymentProviderService.getCustomerId()

      if (!customerId) {
        return {
          paymentMethods: [],
        }
      }

      const defaultPaymentMethodId = await paymentProviderService.getDefaultPaymentMethodId()

      if (defaultPaymentMethodId.err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: defaultPaymentMethodId.err.message,
        })
      }

      const { err, val } = await paymentProviderService.listPaymentMethods({
        limit: 5,
      })

      if (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message,
        })
      }

      return {
        paymentMethods: val,
      }
    } catch (err) {
      const error = err as Error

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      })
    }
  })
