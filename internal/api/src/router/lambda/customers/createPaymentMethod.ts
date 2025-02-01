import { paymentProviderSchema } from "@unprice/db/validators"
import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { AesGCM } from "@unprice/db/utils"
import { env } from "#env.mjs"
import { PaymentProviderService } from "#services/payment-provider/service"
import { protectedApiOrActiveProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const createPaymentMethod = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.createPaymentMethod",
    openapi: {
      method: "POST",
      path: "/edge/customers.createPaymentMethod",
      protect: true,
    },
  })
  .input(
    z.object({
      paymentProvider: paymentProviderSchema,
      customerId: z.string(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    })
  )
  .output(z.object({ success: z.boolean(), url: z.string() }))
  .mutation(async (opts) => {
    const { successUrl, cancelUrl, customerId, paymentProvider } = opts.input

    const project = opts.ctx.project
    const unPriceCustomerId = project.workspace.unPriceCustomerId
    const featureSlug = "customers"

    // check if the customer has access to the feature
    await featureGuard({
      customerId: unPriceCustomerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: project.workspace.isInternal,
      throwOnNoAccess: false,
    })

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
          eq(config.paymentProvider, paymentProvider),
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

    const paymentProviderService = new PaymentProviderService({
      customer: customerData,
      logger: opts.ctx.logger,
      paymentProvider: opts.input.paymentProvider,
      token: decryptedKey,
    })

    const { err, val } = await paymentProviderService.createSession({
      customerId: customerId,
      projectId: project.id,
      email: customerData.email,
      currency: customerData.defaultCurrency,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      })
    }

    return val
  })
