import { waitUntil } from "@vercel/functions"

import { UnPriceVerificationError } from "../pkg/errors"
import type { Context } from "../trpc"
import { getCustomerData } from "./customers"

export const verifyFeature = async ({
  customerId,
  featureSlug,
  projectId,
  workspaceId,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  workspaceId: string
  ctx: Context
}): Promise<{
  currentUsage: number
  limit?: number
}> => {
  const { feature, subscription } = await getCustomerData({
    customerId,
    featureSlug,
    projectId,
    ctx,
  })
  // TODO: add metrics so I know how long this takes, for now save it into the analytics
  const start = performance.now()
  const analytics = ctx.analytics

  // basic data from the request
  const ip = ctx.headers.get("x-real-ip") ?? ""
  const userAgent = ctx.headers.get("user-agent") ?? ""

  const limit = subscription.items.find(
    (item) => item.itemId === feature.id
  )?.limit

  // TODO: add params to usage so we can count or max and get data by date
  const usage = await analytics
    .getUsageFeature({
      planVersionFeatureId: feature.id,
      workspaceId,
      customerId,
      projectId,
    })
    .then((res) => res.data.at(0)?.total_usage ?? 0)

  const analyticsPayload = {
    featureId: feature.featureId,
    planVersionFeatureId: feature.id,
    workspaceId: projectId,
    planVersionId: subscription.planVersionId,
    customerId,
    subscriptionId: subscription.id,
    projectId,
    time: Date.now(),
    ipAddress: ip,
    userAgent: userAgent,
    latency: performance.now() - start,
  }

  switch (feature.featureType) {
    case "usage": {
      if (limit && usage > limit) {
        waitUntil(
          analytics.ingestFeaturesVerification({
            ...analyticsPayload,
            deniedReason: "USAGE_EXCEEDED",
          })
        )

        throw new UnPriceVerificationError({
          code: "USAGE_EXCEEDED",
          message: "Usage not found",
          currentUsage: usage,
          limit: limit,
        })
      }

      // flat feature, just return the feature and the subscription
      break
    }

    case "flat": {
      // TODO: what happens if we have for instance a feature call access with quantity 1, should we check the usage or the customer suppose to
      // have access to the feature if the quantity is 1?
      waitUntil(
        analytics.ingestFeaturesVerification({
          ...analyticsPayload,
          deniedReason: "USAGE_EXCEEDED",
        })
      )

      if (limit && usage > limit) {
        throw new UnPriceVerificationError({
          code: "USAGE_EXCEEDED",
          message: "Usage not found",
          currentUsage: usage,
          limit: limit,
        })
      }

      // flat feature, just return the feature and the subscription
      break
    }
    case "tier": {
      if (limit && usage > limit) {
        waitUntil(
          analytics.ingestFeaturesVerification({
            ...analyticsPayload,
            deniedReason: "USAGE_EXCEEDED",
          })
        )

        throw new UnPriceVerificationError({
          code: "USAGE_EXCEEDED",
          message: "Usage not found",
          currentUsage: usage,
          limit: limit,
        })
      }

      // flat feature, just return the feature and the subscription
      break
    }
    case "package": {
      if (limit && usage > limit) {
        waitUntil(
          analytics.ingestFeaturesVerification({
            ...analyticsPayload,
            deniedReason: "USAGE_EXCEEDED",
          })
        )

        throw new UnPriceVerificationError({
          code: "USAGE_EXCEEDED",
          message: "Usage not found",
          currentUsage: usage,
          limit: limit,
        })
      }

      // flat feature, just return the feature and the subscription
      break
    }

    default:
      throw new UnPriceVerificationError({
        code: "FEATURE_TYPE_NOT_SUPPORTED",
        message: "Feature type not supported",
      })
  }

  waitUntil(analytics.ingestFeaturesVerification(analyticsPayload))

  return {
    currentUsage: usage,
    limit: limit,
  }
}

// TODO: handling errors and logging here
export const reportUsageFeature = async ({
  customerId,
  featureSlug,
  projectId,
  usage,
  workspaceId,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  workspaceId: string
  usage: number
  ctx: Context
}): Promise<{
  success: boolean
}> => {
  const analytics = ctx.analytics
  const start = performance.now()
  const ip = ctx.headers.get("x-real-ip") ?? ""
  const userAgent = ctx.headers.get("user-agent") ?? ""

  const { feature, subscription } = await getCustomerData({
    customerId,
    featureSlug,
    projectId,
    ctx,
  })

  waitUntil(
    analytics
      .ingestFeaturesUsage({
        featureId: feature.featureId,
        planVersionFeatureId: feature.id,
        workspaceId: workspaceId,
        planVersionId: subscription.planVersionId,
        customerId,
        subscriptionId: subscription.id,
        usage: usage,
        projectId,
        time: Date.now(),
        ipAddress: ip,
        userAgent: userAgent,
        latency: performance.now() - start,
      })
      .catch((error) => {
        console.error("Error reporting usage", error)
        // TODO: save the log to tinybird
      })
  )

  return {
    success: true,
  }
}
