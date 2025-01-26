import { TRPCError } from "@trpc/server"
import {
  planSelectBaseSchema,
  planVersionSelectBaseSchema,
  projectSelectBaseSchema,
} from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const getById = protectedProjectProcedure
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      plan: planSelectBaseSchema.extend({
        versions: z.array(planVersionSelectBaseSchema),
        project: projectSelectBaseSchema,
      }),
    })
  )
  .query(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project
    const workspace = opts.ctx.project.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "plans"

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: workspace.isInternal,
      // getById endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const plan = await opts.ctx.db.query.plans.findFirst({
      with: {
        versions: {
          orderBy: (version, { desc }) => [desc(version.createdAtM)],
        },
        project: true,
      },
      where: (plan, { eq, and }) => and(eq(plan.id, id), eq(plan.projectId, project.id)),
    })

    if (!plan) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan not found",
      })
    }

    return {
      plan: plan,
    }
  })
