import { TRPCError } from "@trpc/server"

import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
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
    where: (planVersionFeature, { and, eq, isNull }) =>
      and(
        eq(planVersionFeature.planVersionId, planVersion.id),
        eq(planVersionFeature.projectId, planVersion.projectId),
        isNull(planVersionFeature.priceId)
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

    // update the feature with the price id
    await ctx.db
      .update(schema.planVersionFeatures)
      .set({
        priceId: price?.id ?? null,
        metadata: {
          ...feature.metadata,
          lastTimeSyncPaymentProvider: Date.now(),
        },
      })
      .where(
        and(
          eq(schema.planVersionFeatures.id, feature.id),
          eq(schema.planVersionFeatures.projectId, feature.projectId)
        )
      )
  }

  return {
    planVersion,
  }
}
