import { TRPCError } from "@trpc/server"
import { z } from "zod"

import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { featureInsertBaseSchema, featureSelectBaseSchema } from "@unprice/db/validators"

import { protectedProjectProcedure } from "../../../trpc"

export const create = protectedProjectProcedure
  .input(featureInsertBaseSchema)
  .output(z.object({ feature: featureSelectBaseSchema }))
  .mutation(async (opts) => {
    const { description, slug, title } = opts.input
    const project = opts.ctx.project

    const featureId = utils.newId("feature")

    const featureData = await opts.ctx.db
      .insert(schema.features)
      .values({
        id: featureId,
        slug,
        title,
        projectId: project.id,
        description,
      })
      .returning()
      .then((data) => data[0])

    if (!featureData) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error creating feature",
      })
    }

    return {
      feature: featureData,
    }
  })
