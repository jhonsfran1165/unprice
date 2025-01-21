import { TRPCError } from "@trpc/server"
import { z } from "zod"

import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { featureInsertBaseSchema, featureSelectBaseSchema } from "@unprice/db/validators"
import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"
import { reportUsageFeature } from "../../../utils/shared"

export const create = protectedProjectProcedure
  .input(featureInsertBaseSchema)
  .output(z.object({ feature: featureSelectBaseSchema }))
  .mutation(async (opts) => {
    const { description, slug, title } = opts.input
    const project = opts.ctx.project

    // check if the customer has access to the feature
    await featureGuard({
      customerId: project.workspace.unPriceCustomerId,
      featureSlug: "features",
      ctx: opts.ctx,
      noCache: true,
      // update usage when creating a feature
      updateUsage: true,
      isInternal: project.workspace.isInternal,
    })

    const featureId = utils.newId("feature")

    const featureData = await opts.ctx.db
      .insert(schema.features)
      .values({
        id: featureId,
        slug,
        title,
        projectId: project.id,
        description,
      })
      .returning()
      .then((data) => data[0])

    if (!featureData) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error creating feature",
      })
    }

    opts.ctx.waitUntil(
      // report usage for the new project in background
      reportUsageFeature({
        customerId: project.workspace.unPriceCustomerId,
        featureSlug: "features",
        usage: 1, // the new project
        ctx: opts.ctx,
        isInternal: project.workspace.isInternal,
      })
    )

    return {
      feature: featureData,
    }
  })
