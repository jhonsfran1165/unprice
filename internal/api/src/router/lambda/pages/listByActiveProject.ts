import { pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const listByActiveProject = protectedProjectProcedure
  .input(
    z.object({
      fromDate: z.number().optional(),
      toDate: z.number().optional(),
    })
  )
  .output(
    z.object({
      pages: z.array(pageSelectBaseSchema.extend({})),
    })
  )
  .query(async (opts) => {
    const { fromDate, toDate } = opts.input
    const project = opts.ctx.project

    const pages = await opts.ctx.db.query.pages.findMany({
      where: (page, { eq, and, between, gte, lte }) =>
        and(
          eq(page.projectId, project.id),
          fromDate && toDate ? between(page.createdAtM, fromDate, toDate) : undefined,
          fromDate ? gte(page.createdAtM, fromDate) : undefined,
          toDate ? lte(page.createdAtM, toDate) : undefined
        ),
    })

    return {
      pages,
    }
  })
