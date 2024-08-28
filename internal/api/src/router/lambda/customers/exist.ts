import { customerSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

export const exist = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.exist",
    openapi: {
      method: "POST",
      path: "/edge/customers.exist",
      protect: true,
    },
  })
  .input(customerSelectSchema.pick({ email: true }))
  .output(z.object({ exist: z.boolean() }))
  .mutation(async (opts) => {
    const { email } = opts.input
    const { project } = opts.ctx

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
