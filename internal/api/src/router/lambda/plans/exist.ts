import { z } from "zod"

import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const exist = protectedProjectProcedure
  .input(z.object({ slug: z.string(), id: z.string().optional() }))
  .output(
    z.object({
      exist: z.boolean(),
    })
  )
  .mutation(async (opts) => {
    const { slug, id } = opts.input
    const project = opts.ctx.project
    const workspace = opts.ctx.project.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "plans"

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      noCache: true,
      isInternal: workspace.isInternal,
      // exist endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const plan = await opts.ctx.db.query.plans.findFirst({
      columns: {
        id: true,
      },
      where: (plan, { eq, and }) =>
        id
          ? and(eq(plan.projectId, project.id), eq(plan.id, id))
          : and(eq(plan.projectId, project.id), eq(plan.slug, slug)),
    })

    return {
      exist: !!plan,
    }
  })
