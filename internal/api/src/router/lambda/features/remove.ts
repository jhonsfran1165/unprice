import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const remove = protectedProjectProcedure
  .input(featureSelectBaseSchema.pick({ id: true }))
  .output(z.object({ feature: featureSelectBaseSchema }))
  .mutation(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project

    const deletedFeature = await opts.ctx.db
      .delete(schema.features)
      .where(and(eq(schema.features.projectId, project.id), eq(schema.features.id, id)))
      .returning()
      .then((data) => data[0])

    if (!deletedFeature) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting feature",
      })
    }

    return {
      feature: deletedFeature,
    }
  })
