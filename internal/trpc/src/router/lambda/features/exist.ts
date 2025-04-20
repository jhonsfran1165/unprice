import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const exist = protectedProjectProcedure
  .input(z.object({ slug: z.string() }))
  .output(z.object({ exist: z.boolean() }))
  .mutation(async (opts) => {
    const { slug } = opts.input
    const project = opts.ctx.project

    const result = await featureGuard({
      customerId: project.workspace.unPriceCustomerId,
      featureSlug: "features",
      isMain: project.workspace.isMain,
      metadata: {
        action: "exist",
      },
    })

    if (!result.success) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

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
