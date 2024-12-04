import { TRPCError } from "@trpc/server"
import {
  planSelectBaseSchema,
  planVersionSelectBaseSchema,
  projectSelectBaseSchema,
} from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "../../../trpc"

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
