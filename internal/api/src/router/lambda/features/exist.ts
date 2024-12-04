import { z } from "zod"

import { protectedProjectProcedure } from "../../../trpc"

export const exist = protectedProjectProcedure
  .input(z.object({ slug: z.string() }))
  .output(z.object({ exist: z.boolean() }))
  .mutation(async (opts) => {
    const { slug } = opts.input
    const project = opts.ctx.project

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
