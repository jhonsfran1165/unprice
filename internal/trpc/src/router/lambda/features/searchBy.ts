import { TRPCError } from "@trpc/server"
import { featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"
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

    const result = await featureGuard({
      customerId: project.workspace.unPriceCustomerId,
      featureSlug: "plans",
      isMain: project.workspace.isMain,
      metadata: {
        action: "searchBy",
        module: "feature",
      },
    })

    if (!result.success) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

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
