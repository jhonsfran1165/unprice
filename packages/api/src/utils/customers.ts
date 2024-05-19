import { waitUntil } from "@vercel/functions"

import type {
  PlanVersionExtended,
  SubscriptionExtended,
} from "@builderai/db/validators"

import { getCustomerHash, UnpriceCache } from "../pkg/cache"
import { UnPriceVerificationError } from "../pkg/errors"
import type { Context } from "../trpc"

type FeatureResponse = Pick<
  PlanVersionExtended,
  "planFeatures"
>["planFeatures"][number]

interface GetCustomerDataResponse {
  feature: FeatureResponse
  subscription: SubscriptionExtended
}

export const getCustomerData = async ({
  customerId,
  featureSlug,
  projectId,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  ctx: Context
}): Promise<GetCustomerDataResponse> => {
  const cache = new UnpriceCache()
  // verify is there is cache for the customer
  const customerHash = getCustomerHash(projectId, customerId)
  let activeSubs = []

  const cachedActiveSubs = await cache.getCustomerActiveSubs(customerHash)

  if (cachedActiveSubs && cachedActiveSubs.length > 0) {
    activeSubs = cachedActiveSubs
  } else {
    const customer = await ctx.db.query.customers.findFirst({
      with: {
        subscriptions: {
          where: (sub, { eq }) => eq(sub.status, "active"),
          // get the latest subscription last because if the subscriptions has the same feature, we need to get the latest one
          orderBy(fields, operators) {
            return [operators.desc(fields.startDate)]
          },
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

    if (!customer) {
      throw new UnPriceVerificationError({
        code: "CUSTOMER_NOT_FOUND",
        message: "Customer not found",
      })
    }

    if (customer.subscriptions.length === 0) {
      throw new UnPriceVerificationError({
        code: "CUSTOMER_HAS_NO_SUBSCRIPTION",
        message: "Customer has not active subscription",
      })
    }

    activeSubs = customer.subscriptions
    // cache the active subscriptions
    waitUntil(cache.setCustomerActiveSubs(customerHash, activeSubs))
  }

  const allFeatures = new Map<string, FeatureResponse>()
  const allSubscriptions = new Map<string, SubscriptionExtended>()

  // get all the features and subscriptions
  // TODO: is it true to assume that a subscription can have the same features multiple times and we just overwrite to the latest one?
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

  // we need the subscription for the feature apply checks later on
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
