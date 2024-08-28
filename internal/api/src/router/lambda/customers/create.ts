import { TRPCError } from "@trpc/server"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { customerInsertBaseSchema, customerSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

export const create = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.create",
    openapi: {
      method: "POST",
      path: "/edge/customers.create",
      protect: true,
    },
  })
  .input(customerInsertBaseSchema)
  .output(z.object({ customer: customerSelectSchema }))
  .mutation(async (opts) => {
    const { description, name, email, metadata, defaultCurrency, stripeCustomerId, timezone } =
      opts.input
    const { project } = opts.ctx

    // const unpriceCustomerId = project.workspace.unPriceCustomerId
    // const workspaceId = project.workspaceId

    const customerId = utils.newId("customer")

    // TODO: check what happens when the currency changes?

    const customerData = await opts.ctx.db
      .insert(schema.customers)
      .values({
        id: customerId,
        name,
        email,
        projectId: project.id,
        description,
        timezone: timezone || "UTC",
        active: true,
        ...(metadata && { metadata }),
        ...(defaultCurrency && { defaultCurrency }),
        ...(stripeCustomerId && { stripeCustomerId }),
      })
      .returning()
      .then((data) => data[0])

    if (!customerData) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error creating customer",
      })
    }

    // waitUntil(
    //   reportUsageFeature({
    //     customerId: unpriceCustomerId,
    //     featureSlug: "customers",
    //     projectId: project.id,
    //     workspaceId: workspaceId,
    //     ctx: ctx,
    //     usage: 1,
    //   })
    // )

    return {
      customer: customerData,
    }
  })
