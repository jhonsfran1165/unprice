import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import {
  featureSelectBaseSchema,
  planVersionFeatureDragDropSchema,
  planVersionFeatureInsertBaseSchema,
  planVersionFeatureSelectBaseSchema,
  versionSelectBaseSchema,
} from "@builderai/db/validators"

import {
  createTRPCRouter,
  protectedActiveProjectAdminProcedure,
  protectedActiveProjectProcedure,
} from "../../trpc"

export const planVersionFeatureRouter = createTRPCRouter({
  create: protectedActiveProjectAdminProcedure
    .input(planVersionFeatureInsertBaseSchema)
    .output(
      z.object({
        planVersionFeature: planVersionFeatureSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { featureId, planVersionId, featureType, config, metadata } =
        opts.input
      const project = opts.ctx.project

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

      const planVersionFeatureData = await opts.ctx.db
        .insert(schema.planVersionFeatures)
        .values({
          id: planVersionFeatureId,
          featureId: featureData.id,
          projectId: project.id,
          planVersionId: planVersionData.id,
          paymentProvider: planVersionData.paymentProvider,
          featureType,
          config,
          metadata,
        })
        .returning()
        .then((re) => re[0])

      if (!planVersionFeatureData?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating feature for this version",
        })
      }

      return {
        planVersionFeature: planVersionFeatureData,
      }
    }),

  remove: protectedActiveProjectAdminProcedure
    .input(
      planVersionFeatureSelectBaseSchema
        .pick({
          id: true,
        })
        .required({ id: true })
    )
    .output(z.object({ plan: planVersionFeatureSelectBaseSchema }))
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const planVersionFeatureData =
        await opts.ctx.db.query.planVersionFeatures.findFirst({
          with: {
            planVersion: true,
          },
          where: (featureVersion, { and, eq }) =>
            and(
              eq(featureVersion.id, id),
              eq(featureVersion.projectId, project.id)
            ),
        })

      if (!planVersionFeatureData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "feature version not found",
        })
      }

      if (planVersionFeatureData.planVersion.status === "published") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cannot delete a feature from a published version",
        })
      }

      const deletedPlanVersion = await opts.ctx.db
        .delete(schema.planVersionFeatures)
        .where(
          and(
            eq(schema.planVersionFeatures.projectId, project.id),
            eq(schema.planVersionFeatures.id, planVersionFeatureData.id)
          )
        )
        .returning()
        .then((data) => data[0])

      if (!deletedPlanVersion?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting feature",
        })
      }

      return {
        plan: deletedPlanVersion,
      }
    }),
  update: protectedActiveProjectAdminProcedure
    .input(planVersionFeatureSelectBaseSchema.partial().required({ id: true }))
    .output(
      z.object({
        planVersionFeature: planVersionFeatureSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const {
        id,
        featureId,
        featureType,
        config,
        metadata,
        paymentProvider,
        planVersionId,
        priceId,
      } = opts.input

      const project = opts.ctx.project
      const planVersionFeatureData =
        await opts.ctx.db.query.planVersionFeatures.findFirst({
          with: {
            planVersion: true,
          },
          where: (featureVersion, { and, eq }) =>
            and(
              eq(featureVersion.id, id),
              eq(featureVersion.projectId, project.id)
            ),
        })

      if (!planVersionFeatureData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "feature version not found",
        })
      }

      if (planVersionFeatureData.planVersion.status === "published") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cannot update a feature from a published version",
        })
      }

      // replace lastUnit Inifinity with string "Infinity" -> if infinity is passed as a number it will be converted to null
      // const config = featuresConfig?.map((feature) => {
      //   const { config } = feature
      //   if (config?.tiers) {
      //     config.tiers = config.tiers.map((tier) => {
      //       if (tier.lastUnit === Infinity) {
      //         return {
      //           ...tier,
      //           lastUnit: "Infinity",
      //         }
      //       }
      //       return tier
      //     })
      //   }
      //   return feature
      // })

      const planVersionFeatureUpdated = await opts.ctx.db
        .update(schema.planVersionFeatures)
        .set({
          ...(paymentProvider && { paymentProvider }),
          ...(planVersionId && { planVersionId }),
          ...(featureId && { featureId }),
          ...(featureType && { featureType }),
          ...(config && { config }),
          ...(metadata && { metadata }),
          ...(priceId && { priceId }),
          updatedAt: new Date(),
        })
        .where(
          and(eq(schema.planVersionFeatures.id, planVersionFeatureData.id))
        )
        .returning()
        .then((re) => re[0])

      if (!planVersionFeatureUpdated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating version",
        })
      }

      return {
        planVersionFeature: planVersionFeatureUpdated,
      }
    }),

  getById: protectedActiveProjectProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .output(
      z.object({
        planVersionFeature: planVersionFeatureInsertBaseSchema.extend({
          planVersion: versionSelectBaseSchema,
          feature: featureSelectBaseSchema,
        }),
      })
    )
    .query(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const planVersionFeatureData =
        await opts.ctx.db.query.planVersionFeatures.findFirst({
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
    }),

  getByPlanVersionId: protectedActiveProjectProcedure
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

      const planVersionFeatureData =
        await opts.ctx.db.query.planVersionFeatures.findMany({
          with: {
            planVersion: {
              columns: {
                id: true,
              },
            },
            feature: {
              columns: {
                slug: true,
                id: true,
                title: true,
                description: true,
              },
            },
          },
          where: (planVersionFeature, { and, eq }) =>
            and(
              eq(planVersionFeature.planVersionId, planVersionId),
              eq(planVersionFeature.projectId, project.id)
            ),
        })

      return {
        planVersionFeatures: planVersionFeatureData,
      }
    }),
})
