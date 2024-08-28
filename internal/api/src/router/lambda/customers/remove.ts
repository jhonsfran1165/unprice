import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { customerSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

export const remove = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.remove",
    openapi: {
      method: "POST",
      path: "/edge/customers.remove",
      protect: true,
    },
  })
  .input(customerSelectSchema.pick({ id: true }))
  .output(z.object({ customer: customerSelectSchema }))
  .mutation(async (opts) => {
    const { id } = opts.input
    const { project } = opts.ctx

    // const unpriceCustomerId = project.workspace.unPriceCustomerId
    // const workspaceId = project.workspaceId

    // we just need to validate the entitlements
    // await entitlementGuard({
    //   project,
    //   featureSlug: "customers",
    //   ctx,
    // })

    const deletedCustomer = await opts.ctx.db
      .delete(schema.customers)
      .where(and(eq(schema.customers.projectId, project.id), eq(schema.customers.id, id)))
      .returning()
      .then((re) => re[0])

    if (!deletedCustomer) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting customer",
      })
    }

    // waitUntil(
    //   reportUsageFeature({
    //     customerId: unpriceCustomerId,
    //     featureSlug: "customers",
    //     projectId: project.id,
    //     workspaceId: workspaceId,
    //     ctx: ctx,
    //     usage: -1,
    //   })
    // )

    return {
      customer: deletedCustomer,
    }
  })
