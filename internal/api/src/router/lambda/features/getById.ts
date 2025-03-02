import { TRPCError } from "@trpc/server"
import { featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const getById = protectedProjectProcedure
  .input(z.object({ id: z.string(), projectSlug: z.string() }))
  .output(z.object({ feature: featureSelectBaseSchema.optional() }))
  .query(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project

    const result = await featureGuard({
      customerId: project.workspace.unPriceCustomerId,
      featureSlug: "features",
      ctx: opts.ctx,
      skipCache: true,
      isInternal: project.workspace.isInternal,
    })

    if (!result.access) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

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
