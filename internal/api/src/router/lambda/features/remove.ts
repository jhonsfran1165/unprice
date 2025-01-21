import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"
import { reportUsageFeature } from "../../../utils/shared"

export const remove = protectedProjectProcedure
  .input(featureSelectBaseSchema.pick({ id: true }))
  .output(z.object({ feature: featureSelectBaseSchema }))
  .mutation(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project

    // check if the customer has access to the feature
    await featureGuard({
      customerId: project.workspace.unPriceCustomerId,
      featureSlug: "features",
      ctx: opts.ctx,
      noCache: true,
      // update usage when deleting a feature
      updateUsage: true,
      isInternal: project.workspace.isInternal,
      // delete endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const deletedFeature = await opts.ctx.db
      .delete(schema.features)
      .where(and(eq(schema.features.projectId, project.id), eq(schema.features.id, id)))
      .returning()
      .then((data) => data[0])

    if (!deletedFeature) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting feature",
      })
    }

    opts.ctx.waitUntil(
      // report usage for the new project in background
      reportUsageFeature({
        customerId: project.workspace.unPriceCustomerId,
        featureSlug: "features",
        usage: -1, // the deleted feature
        ctx: opts.ctx,
        isInternal: project.workspace.isInternal,
      })
    )

    return {
      feature: deletedFeature,
    }
  })
