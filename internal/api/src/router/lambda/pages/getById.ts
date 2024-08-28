import { pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const getById = protectedProjectProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .output(
    z.object({
      page: pageSelectBaseSchema.optional(),
    })
  )
  .query(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project

    const pageData = await opts.ctx.db.query.pages.findFirst({
      where: (page, { eq, and }) => and(eq(page.id, id), eq(page.projectId, project.id)),
    })

    return {
      page: pageData,
    }
  })
