import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { pageInsertBaseSchema, pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const update = protectedProjectProcedure
  .input(pageInsertBaseSchema.partial().required({ id: true }))
  .output(
    z.object({
      page: pageSelectBaseSchema,
    })
  )
  .mutation(async (opts) => {
    const { id, subdomain, customDomain, title, content, description } = opts.input
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
      where: (plan, { eq, and }) => and(eq(plan.id, id), eq(plan.projectId, project.id)),
    })

    if (!pageData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "plan not found",
      })
    }

    const updatedPage = await opts.ctx.db
      .update(schema.pages)
      .set({
        subdomain,
        customDomain,
        description,
        title,
        content,
        updatedAtM: Date.now(),
      })
      .where(and(eq(schema.pages.id, id), eq(schema.pages.projectId, project.id)))
      .returning()
      .then((re) => re[0])

    if (!updatedPage) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating page",
      })
    }

    return {
      page: updatedPage,
    }
  })
