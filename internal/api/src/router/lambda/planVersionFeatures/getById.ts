import { TRPCError } from "@trpc/server"
import { z } from "zod"

import {
  featureSelectBaseSchema,
  planVersionFeatureSelectBaseSchema,
  planVersionSelectBaseSchema,
} from "@unprice/db/validators"

import { protectedProjectProcedure } from "#/trpc"

export const getById = protectedProjectProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .output(
    z.object({
      planVersionFeature: planVersionFeatureSelectBaseSchema.extend({
        planVersion: planVersionSelectBaseSchema,
        feature: featureSelectBaseSchema,
      }),
    })
  )
  .query(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project

    const planVersionFeatureData = await opts.ctx.db.query.planVersionFeatures.findFirst({
      with: {
        planVersion: true,
        feature: true,
      },
      where: (planVersion, { and, eq }) =>
        and(eq(planVersion.id, id), eq(planVersion.projectId, project.id)),
    })

    if (!planVersionFeatureData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan version feature not found",
      })
    }

    return {
      planVersionFeature: planVersionFeatureData,
    }
  })
