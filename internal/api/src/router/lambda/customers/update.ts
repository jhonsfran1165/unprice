import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import { customers } from "@unprice/db/schema"
import { customerSelectSchema } from "@unprice/db/validators"
import { protectedApiOrActiveProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

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
    const featureSlug = "customers"

    const result = await featureGuard({
      customerId: unPriceCustomerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: project.workspace.isInternal,
      metadata: {
        action: "update",
      },
    })

    if (!result.access) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

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
      .update(customers)
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
      .where(and(eq(customers.id, id), eq(customers.projectId, project.id)))
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
