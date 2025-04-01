import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { customerSelectSchema } from "@unprice/db/validators"
import { protectedProjectProcedure } from "#trpc"

export const getByEmail = protectedProjectProcedure
  .meta({
    span: "customers.getByEmail",
    openapi: {
      method: "GET",
      path: "/lambda/customers.getByEmail",
      protect: true,
    },
  })
  .input(customerSelectSchema.pick({ email: true }))
  .output(z.object({ customer: customerSelectSchema }))
  .query(async (opts) => {
    const { email } = opts.input
    const project = opts.ctx.project

    const customerData = await opts.ctx.db.query.customers.findFirst({
      where: (customer, { eq, and }) =>
        and(eq(customer.projectId, project.id), eq(customer.email, email)),
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
