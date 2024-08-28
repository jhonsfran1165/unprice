import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const remove = protectedProjectProcedure
  .input(pageSelectBaseSchema.pick({ id: true }))
  .output(z.object({ page: pageSelectBaseSchema }))
  .mutation(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project

    const deletedPage = await opts.ctx.db
      .delete(schema.pages)
      .where(and(eq(schema.pages.projectId, project.id), eq(schema.pages.id, id)))
      .returning()
      .then((data) => data[0])

    if (!deletedPage) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting page",
      })
    }

    return {
      page: deletedPage,
    }
  })
