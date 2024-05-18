import { waitUntil } from "@vercel/functions"

import type {
  PlanVersionExtended,
  SubscriptionExtended,
} from "@builderai/db/validators"

import { UnPriceVerificationError } from "../pkg/errors"
import type { Context } from "../trpc"
import {
  getActiveSubscriptions,
  getCustomerHash,
  setActiveSubscriptions,
} from "./upstash"

type FeatureResponse = Pick<
  PlanVersionExtended,
  "planFeatures"
>["planFeatures"][number]

interface GetFeatureResponse {
  feature: FeatureResponse
  subscription: SubscriptionExtended
}

export const getFeature = async ({
  customerId,
  featureSlug,
  projectId,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  ctx: Context
}): Promise<GetFeatureResponse> => {
  // verify is there is cache for the customer
  const redisId = getCustomerHash(projectId, customerId)
  let activeSubs = []

  const cachedActiveSubs = await getActiveSubscriptions(redisId)

  if (cachedActiveSubs.length > 0) {
    activeSubs = cachedActiveSubs
  } else {
    const customer = await ctx.db.query.customers.findFirst({
      with: {
        subscriptions: {
          where: (sub, { eq }) => eq(sub.status, "active"),
          with: {
            planVersion: {
              with: {
                planFeatures: {
                  with: {
                    feature: true,
                  },
                },
              },
            },
          },
        },
      },
      where: (customer, { eq, and }) =>
        and(eq(customer.id, customerId), eq(customer.projectId, projectId)),
    })

    if (!customer || customer?.subscriptions.length === 0) {
      throw new UnPriceVerificationError({
        code: "CUSTOMER_NOT_FOUND",
        message: "Customer not found",
      })
    }

    activeSubs = customer.subscriptions
    // cache the active subscriptions
    waitUntil(setActiveSubscriptions(redisId, activeSubs))
  }

  const allFeatures = new Map<string, FeatureResponse>()
  const allSubscriptions = new Map<string, SubscriptionExtended>()

  // get all the features and subscriptions
  activeSubs.forEach((sub) => {
    sub.planVersion.planFeatures.forEach((pf) => {
      allFeatures.set(pf.feature.slug, pf)
    })

    allSubscriptions.set(sub.planVersionId, sub)
  })

  const feature = allFeatures.get(featureSlug)

  if (!feature) {
    throw new UnPriceVerificationError({
      code: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
      message: "Feature not found",
    })
  }

  // we need the subscription for the feature to check if it is active
  const subscription = allSubscriptions.get(feature?.planVersionId)

  if (!subscription) {
    throw new UnPriceVerificationError({
      code: "CUSTOMER_HAS_NO_SUBSCRIPTION",
      message: "Subscription not found",
    })
  }

  return {
    feature: feature,
    subscription: subscription,
  }
}
