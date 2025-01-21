import { featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const listByActiveProject = protectedProjectProcedure
  .input(z.void())
  .output(z.object({ features: z.array(featureSelectBaseSchema) }))
  .query(async (opts) => {
    const project = opts.ctx.project

    // check if the customer has access to the feature
    await featureGuard({
      customerId: project.workspace.unPriceCustomerId,
      featureSlug: "features",
      ctx: opts.ctx,
      noCache: true,
      isInternal: project.workspace.isInternal,
      // getById endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const features = await opts.ctx.db.query.features.findMany({
      where: (feature, { eq }) => eq(feature.projectId, project.id),
    })

    return {
      features: features,
    }
  })
