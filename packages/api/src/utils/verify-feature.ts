import type {
  PlanVersionExtended,
  SubscriptionExtended,
} from "@builderai/db/validators"
import { configUsageSchema } from "@builderai/db/validators"

import { UnPriceVerificationError } from "../pkg/errors"
import type { Context } from "../trpc"
import { getFeature } from "./get-feature"

type FeatureResponse = Pick<
  PlanVersionExtended,
  "planFeatures"
>["planFeatures"][number]

interface VerifyFeatureResponse {
  feature: FeatureResponse
  subscription: SubscriptionExtended
}

export const verifyFeature = async ({
  customerId,
  featureSlug,
  projectId,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  ctx: Context
}): Promise<VerifyFeatureResponse> => {
  const { feature, subscription } = await getFeature({
    customerId,
    featureSlug,
    projectId,
    ctx,
  })

  const analytics = ctx.analytics

  switch (feature.featureType) {
    case "usage":
      const { tierMode, tiers, usageMode, aggregationMethod, units, price } =
        configUsageSchema.parse(feature.config)

      console.log("feature", {
        planVersionFeatureId: feature.id,
        workspaceId: "ws_ezP1Zv2ApW9XRp86",
        customerId: customerId,
        projectId,
      })

      const result = await analytics.getUsageFeature({
        planVersionFeatureId: feature.id,
        workspaceId: "ws_ezP1Zv2ApW9XRp86",
        customerId: customerId,
        projectId,
      })

      const usage = result.data?.[0]?.total_usage ?? 0

      if (usage > 60) {
        throw new UnPriceVerificationError({
          code: "USAGE_EXCEEDED",
          message: "Usage not found",
        })
      }

      // flat feature, just return the feature and the subscription
      return {
        feature: feature,
        subscription: subscription,
      }

    case "flat":
      // flat feature, just return the feature and the subscription
      return {
        feature: feature,
        subscription: subscription,
      }
    case "tier": // flat feature, just return the feature and the subscription
      return {
        feature: feature,
        subscription: subscription,
      }
    case "package": // flat feature, just return the feature and the subscription
      return {
        feature: feature,
        subscription: subscription,
      }

    default:
      throw new UnPriceVerificationError({
        code: "FEATURE_TYPE_NOT_SUPPORTED",
        message: "Feature type not supported",
      })
  }
}
