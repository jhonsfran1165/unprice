import { TRPCError } from "@trpc/server"

import type { PlanVersion } from "@builderai/db/validators"

import { StripePaymentProvider } from "../pkg/stripe-payment-provider"
import type { Context } from "../trpc"

interface SyncPaymentProvider {
  planVersion: PlanVersion
}

export const syncPaymentProvider = async ({
  planVersion,
  ctx,
}: {
  planVersion: PlanVersion
  ctx: Context
}): Promise<SyncPaymentProvider> => {
  // get the features in the plan version without a price id
  const planVersionFeatures = await ctx.db.query.planVersionFeatures.findMany({
    with: {
      planVersion: {
        with: {
          plan: true,
        },
      },
      feature: true,
      project: true,
    },
    where: (planVersionFeature, { and, eq }) =>
      and(
        eq(planVersionFeature.planVersionId, planVersion.id),
        eq(planVersionFeature.projectId, planVersion.projectId)
      ),
  })

  if (planVersionFeatures.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No features found in the plan version",
    })
  }

  const paymentProvider = planVersion.paymentProvider

  // get the plan in the payment provider credentials
  // TODO: this should be from the payment provider configuration in the database
  const paymentProviderApiToken = "api_token"

  if (!paymentProvider) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No payment provider found in the plan version",
    })
  }

  if (!paymentProviderApiToken) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No payment provider api token found in the plan version",
    })
  }

  let paymentProviderClient

  if (paymentProvider === "stripe") {
    // TODO: pass the token from the payment provider configuration
    paymentProviderClient = new StripePaymentProvider()
  }

  if (!paymentProviderClient) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid payment provider",
    })
  }

  // TODO what happens if something fails here?
  // TODO: happens if this takes too long?
  for (const feature of planVersionFeatures) {
    // create product and price in the payment provider
    await paymentProviderClient.createProduct(feature)
    const price = await paymentProviderClient.createPrice(feature)
  }

  return {
    planVersion,
  }
}
