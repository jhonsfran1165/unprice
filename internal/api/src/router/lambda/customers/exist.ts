import { customerSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

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
    const project = opts.ctx.project
    const unPriceCustomerId = project.workspace.unPriceCustomerId

    // check if the customer has access to the feature
    await featureGuard({
      customerId: unPriceCustomerId,
      featureSlug: "customers",
      ctx: opts.ctx,
      noCache: true,
      isInternal: project.workspace.isInternal,
      throwOnNoAccess: false,
    })

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
