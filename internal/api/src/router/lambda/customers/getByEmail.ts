import { TRPCError } from "@trpc/server"
import { customerSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const getByEmail = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.getByEmail",
    openapi: {
      method: "GET",
      path: "/edge/customers.getByEmail",
      protect: true,
    },
  })
  .input(customerSelectSchema.pick({ email: true }))
  .output(z.object({ customer: customerSelectSchema }))
  .query(async (opts) => {
    const { email } = opts.input
    const { project } = opts.ctx
    const unPriceCustomerId = project.workspace.unPriceCustomerId

    // check if the customer has access to the feature
    await featureGuard({
      customerId: unPriceCustomerId,
      featureSlug: "customers",
      ctx: opts.ctx,
      skipCache: true,
      isInternal: project.workspace.isInternal,
      throwOnNoAccess: false,
    })

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
