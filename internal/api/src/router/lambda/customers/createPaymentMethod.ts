import { TRPCError } from "@trpc/server"
import { paymentProviderSchema } from "@unprice/db/validators"
import { StripePaymentProvider } from "@unprice/services/payment-provider"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

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
    const project = opts.ctx.project
    const { successUrl, cancelUrl, customerId } = opts.input

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

    switch (opts.input.paymentProvider) {
      case "stripe": {
        const stripePaymentProvider = new StripePaymentProvider({
          paymentCustomerId: customerData.stripeCustomerId,
          logger: opts.ctx.logger,
        })

        const { err, val } = await stripePaymentProvider.createSession({
          customerId: customerId,
          projectId: project.id,
          email: customerData.email,
          currency: customerData.defaultCurrency,
          successUrl: successUrl,
          cancelUrl: cancelUrl,
        })

        if (err ?? !val) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: err.message,
          })
        }

        return val
      }
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment provider not supported yet",
        })
    }
  })
