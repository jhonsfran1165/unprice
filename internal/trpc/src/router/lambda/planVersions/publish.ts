import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { AesGCM } from "@unprice/db/utils"
import { calculateFlatPricePlan, planVersionSelectBaseSchema } from "@unprice/db/validators"
import { PaymentProviderService } from "@unprice/services/payment-provider"
import { isZero } from "dinero.js"
import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { APP_NAME } from "@unprice/config"
import { env } from "#env"
import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const publish = protectedProjectProcedure
  .input(planVersionSelectBaseSchema.partial().required({ id: true }))
  .output(
    z.object({
      planVersion: planVersionSelectBaseSchema,
    })
  )
  .mutation(async (opts) => {
    const { id } = opts.input

    const project = opts.ctx.project
    const workspace = opts.ctx.project.workspace

    // only owner and admin can publish a plan version
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    // check if the customer has access to the feature
    const result = await featureGuard({
      customerId: workspace.unPriceCustomerId,
      featureSlug: "plans",
      isMain: workspace.isMain,
      metadata: {
        action: "publish",
        module: "planVersion",
      },
    })

    if (!result.success) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

    const planVersionData = await opts.ctx.db.query.versions.findFirst({
      with: {
        planFeatures: {
          with: {
            feature: true,
          },
        },
        project: true,
        plan: true,
      },
      where: (version, { and, eq }) => and(eq(version.id, id), eq(version.projectId, project.id)),
    })

    if (!planVersionData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "version not found",
      })
    }

    if (planVersionData.status === "published") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Version already published",
      })
    }

    if (planVersionData.planFeatures.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot publish a version without features",
      })
    }

    // get config payment provider
    const config = await opts.ctx.db.query.paymentProviderConfig.findFirst({
      where: (config, { and, eq }) =>
        and(
          eq(config.projectId, project.id),
          eq(config.paymentProvider, planVersionData.paymentProvider),
          eq(config.active, true)
        ),
    })

    if (!config) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Payment provider config not found or not active. Please check the payment provider config in the project > settings > payment provider.",
      })
    }

    const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

    const decryptedKey = await aesGCM.decrypt({
      iv: config.keyIv,
      ciphertext: config.key,
    })

    const paymentProviderService = new PaymentProviderService({
      logger: opts.ctx.logger,
      paymentProvider: planVersionData.paymentProvider,
      token: decryptedKey,
    })

    // create the products
    await Promise.all(
      planVersionData.planFeatures.map(async (planFeature) => {
        const productName = `${planVersionData.project.name} - ${planFeature.feature.slug} from ${APP_NAME}`

        const { err } = await paymentProviderService.upsertProduct({
          id: planFeature.featureId,
          name: productName,
          type: "service",
          // only pass the description if it is not empty
          ...(planFeature.feature.description
            ? {
                description: planFeature.feature.description,
              }
            : {}),
        })

        if (err) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error syncs product with stripe",
          })
        }
      })
    )

    // verify if the payment method is required
    const { err, val: totalPricePlan } = calculateFlatPricePlan({
      planVersion: planVersionData,
    })

    if (err) {
      opts.ctx.logger.error("Error calculating price plan", {
        error: err,
        planVersionId: planVersionData.id,
      })

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error calculating price plan",
      })
    }

    // if the flat price is not zero, then the payment method is required
    if (!isZero(totalPricePlan.dinero) && !planVersionData.paymentMethodRequired) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Plan total price is not zero, but payment method is not required",
      })
    }

    const paymentMethodRequired = !isZero(totalPricePlan.dinero)

    // we need to create each product on the payment provider
    const planVersionDataUpdated = await opts.ctx.db.transaction(async (tx) => {
      try {
        // set the latest version to false if there is a latest version for this plan
        await tx
          .update(schema.versions)
          .set({
            latest: false,
          })
          .where(
            and(
              eq(schema.versions.projectId, project.id),
              eq(schema.versions.latest, true),
              eq(schema.versions.planId, planVersionData.planId)
            )
          )
          .returning()
          .then((re) => re[0])

        const versionUpdated = await tx
          .update(schema.versions)
          .set({
            status: "published",
            updatedAtM: Date.now(),
            publishedAt: Date.now(),
            publishedBy: opts.ctx.userId,
            latest: true,
            paymentMethodRequired,
          })
          .where(and(eq(schema.versions.id, planVersionData.id)))
          .returning()
          .then((re) => re[0])

        if (!versionUpdated) {
          opts.ctx.logger.error("Version not updated", {
            planVersionData,
          })

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error publishing version",
          })
        }

        return versionUpdated
      } catch (error) {
        const e = error as Error
        opts.ctx.logger.error("Error publishing version", {
          error: e.toString(),
        })

        tx.rollback()

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "error publishing version",
        })
      }
    })

    // ingest the plan version to tinybird
    opts.ctx.waitUntil(
      Promise.all([
        opts.ctx.analytics.ingestPlanVersions({
          id: planVersionDataUpdated.id,
          project_id: planVersionDataUpdated.projectId,
          plan_id: planVersionDataUpdated.planId,
          plan_slug: planVersionData.plan.slug,
          plan_version: planVersionDataUpdated.version,
          currency: planVersionDataUpdated.currency,
          payment_provider: planVersionDataUpdated.paymentProvider,
          billing_interval: planVersionDataUpdated.billingConfig.billingInterval,
          billing_interval_count: planVersionDataUpdated.billingConfig.billingIntervalCount,
          billing_anchor: planVersionDataUpdated.billingConfig.billingAnchor.toString(),
          plan_type: planVersionDataUpdated.billingConfig.planType,
          trial_days: planVersionDataUpdated.trialDays,
          payment_method_required: planVersionDataUpdated.paymentMethodRequired,
          timestamp: new Date(planVersionDataUpdated.publishedAt ?? Date.now()).toISOString(),
        }),

        // ingest the plan version features
        opts.ctx.analytics.ingestPlanVersionFeatures(
          planVersionData.planFeatures.map((feature) => ({
            id: feature.id,
            project_id: feature.projectId,
            plan_version_id: feature.planVersionId,
            feature_id: feature.id,
            feature_type: feature.featureType,
            config: JSON.stringify(feature.config),
            metadata: JSON.stringify(feature.metadata),
            aggregation_method: feature.aggregationMethod,
            default_quantity: feature.defaultQuantity,
            limit: feature.limit,
            hidden: feature.hidden,
            timestamp: new Date(feature.createdAtM).toISOString(),
          }))
        ),
      ])
    )

    return {
      planVersion: planVersionDataUpdated,
    }
  })
