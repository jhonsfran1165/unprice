import { pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

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
    const workspace = opts.ctx.project.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "pages"

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: workspace.isInternal,
      // listByActiveProject endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

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
