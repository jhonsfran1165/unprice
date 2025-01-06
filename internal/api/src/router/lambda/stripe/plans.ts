import { calculateFlatPricePlan } from "@unprice/db/validators"
import { z } from "zod"
import { rateLimiterProcedure } from "../../../trpc"

export const plans = rateLimiterProcedure.input(z.void()).query(async (opts) => {
  // TODO: fix get only the prices with latest version
  const plans = await opts.ctx.db.query.plans.findMany({
    with: {
      versions: {
        where: (fields, operators) =>
          operators.and(
            operators.eq(fields.status, "published")
            // operators.eq(fields.latest, true)
          ),
        with: {
          planFeatures: {
            with: {
              feature: true,
            },
          },
        },
      },
    },
  })

  const dataPricing = plans
    .map((plan) => {
      const planVersion = plan.versions?.at(0)

      if (!planVersion) return null

      const calculatePrice = calculateFlatPricePlan({
        planVersion: {
          plan: {
            ...plan,
          },
          ...planVersion,
        },
      })

      if (calculatePrice.err) return null

      return {
        ...calculatePrice.val,
        planId: planVersion.id,
        planName: plan.slug,
        features: planVersion.planFeatures,
      }
    })
    .filter((price) => price !== null)

  return dataPricing
})
