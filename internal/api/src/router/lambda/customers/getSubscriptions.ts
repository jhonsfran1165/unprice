import { TRPCError } from "@trpc/server"
import { customerSelectSchema, subscriptionSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

export const getSubscriptions = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.getSubscriptions",
    openapi: {
      method: "GET",
      path: "/edge/customers.getSubscriptions",
      protect: true,
    },
  })
  .input(
    z.object({
      customerId: z.string(),
    })
  )
  .output(
    z.object({
      customer: customerSelectSchema.extend({
        subscriptions: subscriptionSelectSchema
          .extend({
            customer: customerSelectSchema,
          })
          .array(),
      }),
    })
  )
  .query(async (opts) => {
    const { customerId } = opts.input
    const { project } = opts.ctx

    const customerWithSubscriptions = await opts.ctx.db.query.customers.findFirst({
      with: {
        subscriptions: {
          with: {
            customer: true,
          },
        },
      },
      where: (table, { eq, and }) => and(eq(table.id, customerId), eq(table.projectId, project.id)),
      orderBy: (table, { desc }) => [desc(table.createdAtM)],
    })

    if (!customerWithSubscriptions) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Customer not found",
      })
    }

    return {
      customer: customerWithSubscriptions,
    }
  })
