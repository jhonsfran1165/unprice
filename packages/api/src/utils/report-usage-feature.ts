import { waitUntil } from "@vercel/functions"

import { UnPriceReportUsageError } from "../pkg/errors"
import type { Context } from "../trpc"
import { getFeature } from "./get-feature"

interface ReportUsageFeatureResponse {
  success: boolean
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
}): Promise<ReportUsageFeatureResponse> => {
  const analytics = ctx.analytics
  const start = performance.now()
  // basic data from the request
  const ip = ctx.headers.get("x-real-ip") ?? ""
  const userAgent = ctx.headers.get("user-agent") ?? ""

  const { feature, subscription } = await getFeature({
    customerId,
    featureSlug,
    projectId,
    ctx,
  })

  if (feature.featureType !== "usage") {
    throw new UnPriceReportUsageError({
      code: "FEATURE_IS_NOT_USAGE_TYPE",
      message: "Cannot report usage for a feature that is not of type usage",
    })
  }

  waitUntil(
    analytics.ingestFeaturesUsage({
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
  )

  return {
    success: true,
  }
}
