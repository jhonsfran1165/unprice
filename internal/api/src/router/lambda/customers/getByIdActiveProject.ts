import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { customerSelectSchema } from "@unprice/db/validators"
import { protectedApiOrActiveProjectProcedure } from "#trpc"

export const getByIdActiveProject = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.getByIdActiveProject",
    openapi: {
      method: "GET",
      path: "/lambda/customers.getByIdActiveProject",
      protect: true,
    },
  })
  .input(customerSelectSchema.pick({ id: true }))
  .output(z.object({ customer: customerSelectSchema }))
  .query(async (opts) => {
    const { id } = opts.input
    const { project } = opts.ctx

    const customerData = await opts.ctx.db.query.customers.findFirst({
      where: (customer, { eq, and }) =>
        and(eq(customer.projectId, project.id), eq(customer.id, id)),
    })

    if (!customerData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Customer not found",
      })
    }

    return {
      customer: customerData,
    }
  })
