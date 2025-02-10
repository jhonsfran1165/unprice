import { TRPCError } from "@trpc/server"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import {
  planVersionFeatureDragDropSchema,
  planVersionFeatureInsertBaseSchema,
} from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"

export const create = protectedProjectProcedure
  .input(planVersionFeatureInsertBaseSchema)
  .output(
    z.object({
      planVersionFeature: planVersionFeatureDragDropSchema,
    })
  )
  .mutation(async (opts) => {
    const {
      featureId,
      planVersionId,
      featureType,
      config,
      metadata,
      order,
      defaultQuantity,
      limit,
      hidden,
    } = opts.input
    const project = opts.ctx.project

    // only owner and admin can create a feature
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const planVersionData = await opts.ctx.db.query.versions.findFirst({
      where: (version, { eq, and }) =>
        and(eq(version.id, planVersionId), eq(version.projectId, project.id)),
    })

    if (!planVersionData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "version of the plan not found",
      })
    }

    // if published we should not allow to add a feature
    if (planVersionData.status === "published") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Cannot add a feature to a published version",
      })
    }

    const featureData = await opts.ctx.db.query.features.findFirst({
      where: (feature, { eq, and }) =>
        and(eq(feature.id, featureId), eq(feature.projectId, project.id)),
    })

    if (!featureData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "feature not found",
      })
    }

    const planVersionFeatureId = utils.newId("feature_version")

    const planVersionFeatureCreated = await opts.ctx.db
      .insert(schema.planVersionFeatures)
      .values({
        id: planVersionFeatureId,
        featureId: featureData.id,
        projectId: project.id,
        planVersionId: planVersionData.id,
        featureType,
        config,
        metadata,
        order: order ?? "1024",
        defaultQuantity: defaultQuantity === 0 ? null : defaultQuantity,
        limit: limit === 0 ? null : limit,
        hidden,
      })
      .returning()
      .then((re) => re[0])

    if (!planVersionFeatureCreated?.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error creating feature for this version",
      })
    }

    const planVersionFeatureData = await opts.ctx.db.query.planVersionFeatures.findFirst({
      with: {
        planVersion: true,
        feature: true,
      },
      where: (planVersionFeature, { and, eq }) =>
        and(
          eq(planVersionFeature.id, planVersionFeatureCreated.id),
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
