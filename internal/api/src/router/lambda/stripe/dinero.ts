import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import { features, planVersionFeatures } from "@unprice/db/schema"
import { toStripeMoney } from "@unprice/db/utils"
import { calculatePricePerFeature } from "@unprice/db/validators"
import { z } from "zod"
import { rateLimiterProcedure } from "../../../trpc"

export const dinero = rateLimiterProcedure.input(z.void()).query(async (opts) => {
  // TODO: fix priceId

  const now = new Date()

  // Get the start of the current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get the end of the current month
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const usageTiny = await opts.ctx.analytics
    .getTotalUsagePerFeature({
      projectId: "prj_2GGH1GE4864s4GrX6ttkjbStDP3k",
      featureSlug: "verifications",
      customerId: "cus_2GGH1GE4864s4GrX6ttkjbStDP3k",
      start: startOfMonth.getTime(),
      end: endOfMonth.getTime(),
    })
    .then((usage) => usage.data[0])

  const feature = await opts.ctx.db
    .select({
      planVersionFeatures,
    })
    .from(features)
    .innerJoin(
      planVersionFeatures,
      and(
        eq(features.id, planVersionFeatures.featureId),
        eq(features.projectId, planVersionFeatures.projectId)
      )
    )
    .where(eq(features.slug, "seats"))
    .limit(1)
    .then((res) => res?.[0])

  if (!feature?.planVersionFeatures) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Feature not found",
    })
  }

  const priceCalculation = calculatePricePerFeature({
    feature: feature.planVersionFeatures,
    quantity: usageTiny?.[feature.planVersionFeatures.aggregationMethod] ?? 0,
    prorate: 0.5,
  })

  if (priceCalculation.err) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Error calculating price",
    })
  }

  return [
    {
      usageTiny,
      priceCalculation: toStripeMoney(priceCalculation.val.totalPrice.dinero),
    },
  ]
})
