import { TRPCError } from "@trpc/server"
import * as schema from "@unprice/db/schema"
import { createSlug, newId } from "@unprice/db/utils"
import { pageInsertBaseSchema, pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"
import { reportUsageFeature } from "#utils/shared"

export const create = protectedProjectProcedure
  .input(pageInsertBaseSchema)
  .output(
    z.object({
      page: pageSelectBaseSchema,
    })
  )
  .mutation(async (opts) => {
    const { title, subdomain, customDomain, description } = opts.input
    const project = opts.ctx.project
    const workspace = opts.ctx.project.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "pages"

    // only owner and admin can create a page
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      updateUsage: true,
      isInternal: workspace.isInternal,
    })

    const pageId = newId("page")
    const slug = createSlug()

    const pageData = await opts.ctx.db
      .insert(schema.pages)
      .values({
        id: pageId,
        slug,
        title,
        projectId: project.id,
        description,
        subdomain,
        customDomain: customDomain || null,
      })
      .returning()
      .catch((err) => {
        opts.ctx.logger.error(err)

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create page",
        })
      })
      .then((pageData) => {
        return pageData[0]
      })

    if (!pageData?.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "error creating page",
      })
    }

    opts.ctx.waitUntil(
      // report usage for the new page in background
      reportUsageFeature({
        customerId,
        featureSlug,
        usage: 1, // the new page
        ctx: opts.ctx,
        isInternal: workspace.isInternal,
      })
    )

    return {
      page: pageData,
    }
  })
