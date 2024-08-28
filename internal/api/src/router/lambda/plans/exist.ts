import { z } from "zod"

import { protectedProjectProcedure } from "../../../trpc"

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
