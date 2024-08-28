import { TRPCError } from "@trpc/server"
import * as schema from "@unprice/db/schema"
import { createSlug, newId } from "@unprice/db/utils"
import { pageInsertBaseSchema, pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

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
      .then((pageData) => {
        return pageData[0]
      })

    if (!pageData?.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "error creating page",
      })
    }

    return {
      page: pageData,
    }
  })
