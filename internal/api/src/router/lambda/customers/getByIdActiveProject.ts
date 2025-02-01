import { protectedApiOrActiveProjectProcedure } from "#/trpc"
import { featureGuard } from "#/utils/feature-guard"
import { TRPCError } from "@trpc/server"
import { customerSelectSchema } from "@unprice/db/validators"
import { z } from "zod"

export const getByIdActiveProject = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.getByIdActiveProject",
    openapi: {
      method: "GET",
      path: "/edge/customers.getByIdActiveProject",
      protect: true,
    },
  })
  .input(customerSelectSchema.pick({ id: true }))
  .output(z.object({ customer: customerSelectSchema }))
  .query(async (opts) => {
    const { id } = opts.input
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
