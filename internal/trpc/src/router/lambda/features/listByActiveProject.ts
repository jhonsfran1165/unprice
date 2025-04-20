import { featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const listByActiveProject = protectedProjectProcedure
  .input(z.void())
  .output(z.object({ features: z.array(featureSelectBaseSchema) }))
  .query(async (opts) => {
    const project = opts.ctx.project

    const features = await opts.ctx.db.query.features.findMany({
      where: (feature, { eq }) => eq(feature.projectId, project.id),
    })

    return {
      features: features,
    }
  })
