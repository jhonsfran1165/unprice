import { TRPCError } from "@trpc/server"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { customerInsertBaseSchema, customerSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"
import { reportUsageFeature } from "../../../utils/shared"

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

    const unPriceCustomerId = project.workspace.unPriceCustomerId
    const featureSlug = "customers"

    // check if the customer has access to the feature
    await featureGuard({
      customerId: unPriceCustomerId,
      featureSlug,
      ctx: opts.ctx,
      noCache: true,
      updateUsage: true,
      isInternal: project.workspace.isInternal,
    })

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

    opts.ctx.waitUntil(
      // report usage for the new project in background
      reportUsageFeature({
        customerId: unPriceCustomerId,
        featureSlug,
        usage: 1, // the new customer
        ctx: opts.ctx,
        isInternal: project.workspace.isInternal,
      })
    )

    return {
      customer: customerData,
    }
  })
