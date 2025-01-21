import { pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

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
    const workspace = opts.ctx.project.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "pages"

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      noCache: true,
      isInternal: workspace.isInternal,
      // getById endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const pageData = await opts.ctx.db.query.pages.findFirst({
      where: (page, { eq, and }) => and(eq(page.id, id), eq(page.projectId, project.id)),
    })

    return {
      page: pageData,
    }
  })
