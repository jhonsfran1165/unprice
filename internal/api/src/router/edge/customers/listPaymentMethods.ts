import { TRPCError } from "@trpc/server"
import { paymentProviderSchema } from "@unprice/db/validators"
import { z } from "zod"
import { StripePaymentProvider } from "../../../pkg/payment-provider/stripe"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

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

    switch (provider) {
      case "stripe": {
        if (!customerData.stripeCustomerId) {
          return {
            paymentMethods: [],
          }
        }

        const stripePaymentProvider = new StripePaymentProvider({
          paymentCustomerId: customerData.stripeCustomerId,
          logger: opts.ctx.logger,
        })

        const { err, val } = await stripePaymentProvider.listPaymentMethods({
          limit: 5,
        })

        if (err ?? !val) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: err.message,
          })
        }

        return {
          paymentMethods: val,
        }
      }
      default:
        return {
          paymentMethods: [],
        }
    }
  })
