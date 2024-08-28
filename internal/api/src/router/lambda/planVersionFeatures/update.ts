import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import {
  planVersionFeatureDragDropSchema,
  planVersionFeatureSelectBaseSchema,
} from "@unprice/db/validators"

import { protectedProjectProcedure } from "../../../trpc"

export const update = protectedProjectProcedure
  .input(planVersionFeatureSelectBaseSchema.partial().required({ id: true, planVersionId: true }))
  .output(
    z.object({
      planVersionFeature: planVersionFeatureDragDropSchema,
    })
  )
  .mutation(async (opts) => {
    const {
      id,
      featureId,
      featureType,
      config,
      metadata,
      planVersionId,
      order,
      defaultQuantity,
      aggregationMethod,
      limit,
      hidden,
    } = opts.input

    // we purposely don't allow to update the currency and the payment provider
    // those should be update from another method because they are related to the plan version

    const project = opts.ctx.project

    // only owner and admin can update a feature
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const planVersionData = await opts.ctx.db.query.versions.findFirst({
      where: (version, { and, eq }) =>
        and(eq(version.id, planVersionId), eq(version.projectId, project.id)),
    })

    if (!planVersionData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "version of the plan not found",
      })
    }

    if (planVersionData.status === "published") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Cannot update a feature from a published version",
      })
    }

    const planVersionFeatureUpdated = await opts.ctx.db
      .update(schema.planVersionFeatures)
      .set({
        ...(planVersionId && { planVersionId }),
        ...(featureId && { featureId }),
        ...(featureType && { featureType }),
        ...(config && { config }),
        ...(metadata && { metadata }),
        ...(order && { order }),
        ...(defaultQuantity !== undefined && {
          defaultQuantity: defaultQuantity === 0 ? null : defaultQuantity,
        }),
        ...(limit !== undefined && { limit: limit === 0 ? null : limit }),
        ...(hidden !== undefined && { hidden }),
        ...(aggregationMethod && { aggregationMethod }),
        updatedAtM: Date.now(),
      })
      .where(
        and(
          eq(schema.planVersionFeatures.id, id),
          eq(schema.planVersionFeatures.projectId, project.id)
        )
      )
      .returning()
      .then((re) => re[0])

    if (!planVersionFeatureUpdated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating version",
      })
    }

    const planVersionFeatureData = await opts.ctx.db.query.planVersionFeatures.findFirst({
      with: {
        planVersion: true,
        feature: true,
      },
      where: (planVersionFeature, { and, eq }) =>
        and(
          eq(planVersionFeature.id, planVersionFeatureUpdated.id),
          eq(planVersionFeature.projectId, project.id)
        ),
    })

    if (!planVersionFeatureData?.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching the created feature",
      })
    }

    return {
      planVersionFeature: planVersionFeatureData,
    }
  })
