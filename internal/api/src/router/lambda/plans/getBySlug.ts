import { TRPCError } from "@trpc/server"
import { planSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "../../../trpc"

export const getBySlug = protectedProjectProcedure
  .input(z.object({ slug: z.string() }))
  .output(
    z.object({
      plan: planSelectBaseSchema,
    })
  )
  .query(async (opts) => {
    const { slug } = opts.input
    const project = opts.ctx.project

    const plan = await opts.ctx.db.query.plans.findFirst({
      where: (plan, { eq, and }) => and(eq(plan.slug, slug), eq(plan.projectId, project.id)),
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
