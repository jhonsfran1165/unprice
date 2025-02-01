import { protectedProjectProcedure } from "#/trpc"
import { featureGuard } from "#/utils/feature-guard"
import { featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

export const getById = protectedProjectProcedure
  .input(z.object({ id: z.string(), projectSlug: z.string() }))
  .output(z.object({ feature: featureSelectBaseSchema.optional() }))
  .query(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project

    // check if the customer has access to the feature
    await featureGuard({
      customerId: project.workspace.unPriceCustomerId,
      featureSlug: "features",
      ctx: opts.ctx,
      skipCache: true,
      isInternal: project.workspace.isInternal,
      // getById endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const feature = await opts.ctx.db.query.features.findFirst({
      with: {
        project: {
          columns: {
            slug: true,
          },
        },
      },
      where: (feature, { eq, and }) => and(eq(feature.projectId, project.id), eq(feature.id, id)),
    })

    return {
      feature: feature,
    }
  })
