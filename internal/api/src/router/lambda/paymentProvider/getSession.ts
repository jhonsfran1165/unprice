import { TRPCError } from "@trpc/server"
import { AesGCM } from "@unprice/db/utils"
import { paymentProviderSchema } from "@unprice/db/validators"
import { PaymentProviderService } from "@unprice/services/payment-provider"
import { z } from "zod"
import { env } from "../../../env.mjs"
import { rateLimiterProcedure } from "../../../trpc"

export const getSession = rateLimiterProcedure
  .meta({
    span: "paymentProvider.getSession",
    openapi: {
      method: "POST",
      path: "/edge/paymentProvider.getSession",
      protect: true,
    },
  })
  .input(
    z.object({
      paymentProvider: paymentProviderSchema,
      sessionId: z.string(),
      projectId: z.string(),
    })
  )
  .output(
    z.object({
      metadata: z.record(z.string(), z.string()).nullable(),
      customerId: z.string(),
      subscriptionId: z.string().nullable(),
      paymentMethodId: z.string().nullable(),
    })
  )
  .mutation(async (opts) => {
    const { sessionId, paymentProvider, projectId } = opts.input

    // get config payment provider
    const config = await opts.ctx.db.query.paymentProviderConfig.findFirst({
      where: (config, { and, eq }) =>
        and(
          eq(config.projectId, projectId),
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
      logger: opts.ctx.logger,
      paymentProvider: opts.input.paymentProvider,
      token: decryptedKey,
    })

    const { err, val } = await paymentProviderService.getSession({
      sessionId,
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      })
    }

    // set customer id so we can use it in the next request
    paymentProviderService.setCustomerId(val.customerId)

    const paymentMethods = await paymentProviderService.listPaymentMethods({
      limit: 1,
    })

    if (paymentMethods.err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: paymentMethods.err.message,
      })
    }

    return {
      ...val,
      paymentMethodId: paymentMethods.val.at(0)?.id ?? null,
    }
  })
