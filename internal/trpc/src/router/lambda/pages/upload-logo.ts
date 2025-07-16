import { TRPCError } from "@trpc/server"
import * as schema from "@unprice/db/schema"
import { pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const uploadLogo = protectedProjectProcedure
  .input(
    z.object({
      name: z.string(),
      file: z.string().min(1),
      type: z.string().min(1),
    })
  )
  .output(
    z.object({
      page: pageSelectBaseSchema,
    })
  )
  .mutation(async (opts) => {
    // Store the base64 string directly
    const logo = opts.input.file
    const type = opts.input.type

    const pageData = await opts.ctx.db
      .update(schema.pages)
      .set({
        logo,
        logoType: type,
      })
      .returning()
      .catch((err) => {
        opts.ctx.logger.error(err)

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update logo",
        })
      })
      .then((pageData) => {
        return pageData[0]
      })

    if (!pageData?.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "error updating logo",
      })
    }

    return {
      page: pageData,
    }
  })
