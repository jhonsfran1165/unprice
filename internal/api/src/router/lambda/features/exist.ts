import { z } from "zod"

import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const exist = protectedProjectProcedure
  .input(z.object({ slug: z.string() }))
  .output(z.object({ exist: z.boolean() }))
  .mutation(async (opts) => {
    const { slug } = opts.input
    const project = opts.ctx.project

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
      columns: {
        id: true,
      },
      where: (feature, { eq, and }) =>
        and(eq(feature.projectId, project.id), eq(feature.slug, slug)),
    })

    return {
      exist: !!feature,
    }
  })
