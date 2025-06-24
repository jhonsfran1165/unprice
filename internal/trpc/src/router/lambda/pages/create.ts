import { TRPCError } from "@trpc/server"
import * as schema from "@unprice/db/schema"
import { createSlug, newId } from "@unprice/db/utils"
import { pageInsertBaseSchema, pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { FEATURE_SLUGS } from "@unprice/config"
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
    const featureSlug = FEATURE_SLUGS.PAGES

    // only owner and admin can create a page
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const result = await featureGuard({
      customerId,
      featureSlug,
      isMain: workspace.isMain,
      metadata: {
        action: "create",
      },
    })

    if (!result.success) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

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
        faqs: [],
        colorPalette: {
          primary: "#000000",
          secondary: "#000000",
          accent: "#000000",
          background: "#000000",
          text: "#000000",
          border: "#000000",
        },
        selectedPlans: [],
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
      reportUsageFeature({
        customerId,
        featureSlug,
        usage: 1,
        isMain: workspace.isMain,
        metadata: {
          action: "create",
        },
      })
    )

    return {
      page: pageData,
    }
  })
