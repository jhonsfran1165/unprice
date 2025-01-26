import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { customerSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const update = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.update",
    openapi: {
      method: "POST",
      path: "/edge/customers.update",
      protect: true,
    },
  })
  .input(
    customerSelectSchema
      .pick({
        id: true,
        name: true,
        description: true,
        email: true,
        metadata: true,
        timezone: true,
      })
      .partial({
        description: true,
        metadata: true,
        timezone: true,
      })
  )
  .output(z.object({ customer: customerSelectSchema }))
  .mutation(async (opts) => {
    const { email, id, description, metadata, name, timezone } = opts.input
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
      where: (feature, { eq, and }) => and(eq(feature.id, id), eq(feature.projectId, project.id)),
    })

    if (!customerData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Customer not found",
      })
    }

    const updatedCustomer = await opts.ctx.db
      .update(schema.customers)
      .set({
        ...(email && { email }),
        ...(description && { description }),
        ...(name && { name }),
        ...(metadata && {
          metadata: {
            ...customerData.metadata,
            ...metadata,
          },
        }),
        ...(timezone && { timezone }),
        updatedAtM: Date.now(),
      })
      .where(and(eq(schema.customers.id, id), eq(schema.customers.projectId, project.id)))
      .returning()
      .then((data) => data[0])

    if (!updatedCustomer) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating customer",
      })
    }

    return {
      customer: updatedCustomer,
    }
  })
