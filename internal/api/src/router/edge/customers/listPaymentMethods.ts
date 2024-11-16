import { TRPCError } from "@trpc/server"
import { paymentProviderSchema } from "@unprice/db/validators"
import { PaymentProviderService } from "@unprice/services/payment-provider"
import { z } from "zod"
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

    // if the customer doesn't have a customer provider id, we return an empty array
    if (!customerData.stripeCustomerId) {
      return {
        paymentMethods: [],
      }
    }

    try {
      const paymentProviderService = new PaymentProviderService({
        customer: customerData,
        logger: opts.ctx.logger,
        paymentProviderId: provider,
      })

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
