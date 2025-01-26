import { featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const searchBy = protectedProjectProcedure
  .input(
    z.object({
      search: z.string().optional(),
    })
  )
  .output(z.object({ features: z.array(featureSelectBaseSchema) }))
  .query(async (opts) => {
    const { search } = opts.input
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

    const filter = `%${search}%`

    const features = await opts.ctx.db.query.features.findMany({
      where: (feature, { eq, and, or, ilike }) =>
        and(
          eq(feature.projectId, project.id),
          or(ilike(feature.slug, filter), ilike(feature.title, filter))
        ),
      orderBy: (feature, { desc }) => [desc(feature.updatedAtM), desc(feature.title)],
    })

    return {
      features: features,
    }
  })
