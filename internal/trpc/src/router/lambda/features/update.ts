import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const update = protectedProjectProcedure
  .input(
    featureSelectBaseSchema.pick({ id: true, title: true, description: true }).partial({
      description: true,
    })
  )
  .output(z.object({ feature: featureSelectBaseSchema }))
  .mutation(async (opts) => {
    const { title, id, description } = opts.input
    const project = opts.ctx.project

    const featureData = await opts.ctx.db.query.features.findFirst({
      where: (feature, { eq, and }) => and(eq(feature.id, id), eq(feature.projectId, project.id)),
    })

    if (!featureData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Feature not found",
      })
    }

    const data = await opts.ctx.db
      .update(schema.features)
      .set({
        title,
        description: description ?? "",
        updatedAtM: Date.now(),
      })
      .where(and(eq(schema.features.id, id), eq(schema.features.projectId, project.id)))
      .returning()
      .then((data) => data[0])

    if (!data) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating feature",
      })
    }

    return {
      feature: data,
    }
  })
