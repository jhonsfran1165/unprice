import { featureSelectBaseSchema, featureVerificationSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const listByActiveProject = protectedProjectProcedure
  .input(z.void())
  .output(
    z.object({ features: z.array(featureSelectBaseSchema), error: featureVerificationSchema })
  )
  .query(async (opts) => {
    const project = opts.ctx.project

    const result = await featureGuard({
      customerId: project.workspace.unPriceCustomerId,
      featureSlug: "features",
      isMain: project.workspace.isMain,
      metadata: {
        action: "listByActiveProject",
      },
    })

    if (!result.success) {
      return {
        features: [],
        error: result,
      }
    }

    const features = await opts.ctx.db.query.features.findMany({
      where: (feature, { eq }) => eq(feature.projectId, project.id),
    })

    return {
      features: features,
      error: result,
    }
  })
