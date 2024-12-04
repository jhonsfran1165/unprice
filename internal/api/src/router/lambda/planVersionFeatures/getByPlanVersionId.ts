import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { planVersionFeatureDragDropSchema } from "@unprice/db/validators"

import { protectedProjectProcedure } from "../../../trpc"

export const getByPlanVersionId = protectedProjectProcedure
  .input(
    z.object({
      planVersionId: z.string(),
    })
  )
  .output(
    z.object({
      planVersionFeatures: planVersionFeatureDragDropSchema.array(),
    })
  )
  .query(async (opts) => {
    const { planVersionId } = opts.input
    const project = opts.ctx.project

    const planVersionData = await opts.ctx.db.query.versions.findFirst({
      where: (version, { and, eq }) =>
        and(eq(version.id, planVersionId), eq(version.projectId, project.id)),
    })

    if (!planVersionData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan version not found",
      })
    }

    const planVersionFeatureData = await opts.ctx.db.query.planVersionFeatures.findMany({
      with: {
        planVersion: {
          columns: {
            id: true,
          },
        },
        feature: true,
      },
      where: (planVersionFeature, { and, eq }) =>
        and(
          eq(planVersionFeature.planVersionId, planVersionId),
          eq(planVersionFeature.projectId, project.id)
        ),
    })

    if (!planVersionFeatureData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan version features not found",
      })
    }

    return {
      planVersionFeatures: planVersionFeatureData,
    }
  })
