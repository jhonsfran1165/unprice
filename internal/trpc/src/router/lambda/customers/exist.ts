import { z } from "zod"

import { customerSelectSchema } from "@unprice/db/validators"
import { protectedProjectProcedure } from "#trpc"

export const exist = protectedProjectProcedure
  .meta({
    span: "customers.exist",
    openapi: {
      method: "POST",
      path: "/lambda/customers.exist",
      protect: true,
    },
  })
  .input(customerSelectSchema.pick({ email: true }))
  .output(z.object({ exist: z.boolean() }))
  .mutation(async (opts) => {
    const { email } = opts.input
    const project = opts.ctx.project

    const customerData = await opts.ctx.db.query.customers.findFirst({
      columns: {
        id: true,
      },
      where: (customer, { eq, and }) =>
        and(eq(customer.projectId, project.id), eq(customer.email, email)),
    })

    return {
      exist: !!customerData,
    }
  })
