import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { protectedProjectProcedure } from "#trpc"

export const migrate = protectedProjectProcedure
  .input(z.void())
  .output(
    z.object({
      success: z.boolean(),
    })
  )
  .mutation(async (opts) => {
    const projectId = opts.ctx.project.id
    const isMain = opts.ctx.project.workspace.isMain
    const isInternal = opts.ctx.project.workspace.isInternal

    if (!isMain && !isInternal) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Only main or internal projects can be migrated to analytics",
      })
    }

    // only owner can migrate
    opts.ctx.verifyRole(["OWNER"])

    // get all plan versions that are published
    const data = await opts.ctx.db.query.versions.findMany({
      with: {
        plan: true,
        planFeatures: {
          with: {
            feature: true,
          },
        },
      },
      where: (versions, { eq, and }) =>
        and(eq(versions.projectId, projectId), eq(versions.status, "published")),
    })

    if (!data || data.length === 0) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No data found for this project",
      })
    }

    const planVersions = []
    const planVersionFeatures = []
    const features = []

    for (const version of data) {
      planVersions.push({
        id: version.id,
        project_id: version.projectId,
        plan_id: version.planId,
        plan_slug: version.plan.slug,
        plan_version: version.version,
        currency: version.currency,
        payment_provider: version.paymentProvider,
        billing_interval: version.billingConfig.billingInterval,
        billing_interval_count: version.billingConfig.billingIntervalCount,
        billing_anchor: version.billingConfig.billingAnchor.toString(),
        plan_type: version.billingConfig.planType,
        trial_days: version.trialDays,
        payment_method_required: version.paymentMethodRequired,
        timestamp: new Date(version.publishedAt ?? Date.now()).toISOString(),
      })

      for (const featureVersion of version.planFeatures) {
        planVersionFeatures.push({
          id: featureVersion.id,
          project_id: featureVersion.projectId,
          plan_version_id: featureVersion.planVersionId,
          feature_id: featureVersion.featureId,
          feature_type: featureVersion.featureType,
          config: JSON.stringify(featureVersion.config),
          metadata: JSON.stringify(featureVersion.metadata),
          aggregation_method: featureVersion.aggregationMethod,
          default_quantity: featureVersion.defaultQuantity,
          limit: featureVersion.limit,
          hidden: featureVersion.hidden,
          timestamp: new Date(featureVersion.createdAtM).toISOString(),
        })

        features.push({
          id: featureVersion.feature.id,
          project_id: featureVersion.feature.projectId,
          slug: featureVersion.feature.slug,
          code: featureVersion.feature.code,
          timestamp: new Date(featureVersion.feature.createdAtM).toISOString(),
        })
      }
    }

    // ingest the data
    const [planVersionsData, planVersionFeaturesData, featuresData] = await Promise.all([
      opts.ctx.analytics.ingestPlanVersions(planVersions),
      opts.ctx.analytics.ingestPlanVersionFeatures(planVersionFeatures),
      opts.ctx.analytics.ingestFeatures(features),
    ])

    if (
      planVersionsData.quarantined_rows > 0 ||
      planVersionFeaturesData.quarantined_rows > 0 ||
      featuresData.quarantined_rows > 0
    ) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error ingesting data",
      })
    }

    return { success: true }
  })
