import { TRPCError } from "@trpc/server"
import * as schema from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import { featureInsertBaseSchema, featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"
import { reportUsageFeature } from "#utils/shared"

export const create = protectedProjectProcedure
  .input(featureInsertBaseSchema)
  .output(z.object({ feature: featureSelectBaseSchema }))
  .mutation(async (opts) => {
    const { description, slug, title } = opts.input
    const project = opts.ctx.project

    // check if the customer has access to the feature
    const result = await featureGuard({
      customerId: project.workspace.unPriceCustomerId,
      featureSlug: "features",
      isMain: project.workspace.isMain,
      metadata: {
        action: "create",
      },
    })

    if (!result.success) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

    const featureId = newId("feature")
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
      reportUsageFeature({
        customerId: project.workspace.unPriceCustomerId,
        featureSlug: "features",
        usage: 1,
        isMain: project.workspace.isMain,
        metadata: {
          action: "create",
        },
      })
    )

    return {
      feature: featureData,
    }
  })
