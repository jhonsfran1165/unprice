import { pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"
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

    const result = await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: workspace.isInternal,
    })

    if (!result.access) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

    const pageData = await opts.ctx.db.query.pages.findFirst({
      where: (page, { eq, and }) => and(eq(page.id, id), eq(page.projectId, project.id)),
    })

    return {
      page: pageData,
    }
  })
