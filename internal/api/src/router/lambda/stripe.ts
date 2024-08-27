import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import { features, planVersionFeatures } from "@unprice/db/schema"
import { toStripeMoney } from "@unprice/db/utils"
import { calculateFlatPricePlan, calculatePricePerFeature } from "@unprice/db/validators"
import { z } from "zod"
import { createTRPCRouter, rateLimiterProcedure } from "../../trpc"

export const stripeRouter = createTRPCRouter({
  // createLinkAccount: protectedProjectProcedure
  //   .input(z.void())
  //   .output(
  //     z.object({
  //       success: z.boolean(),
  //       url: z.string(),
  //     })
  //   )
  //   .mutation(async (opts) => {
  //     const user = opts.ctx.session.user
  //     const project = opts.ctx.project
  //     const workspace = opts.ctx.workspace

  //     const accountId = project.stripeAccountId
  //     let account

  //     if (!accountId) {
  //       account = await stripe.accounts.create({
  //         type: "standard",
  //         email: user.email ?? "",
  //         country: "DE", // TODO: fix country
  //         capabilities: {
  //           card_payments: { requested: false },
  //           transfers: { requested: false },
  //         },
  //       })
  //     } else {
  //       account = await stripe.accounts.retrieve(accountId)
  //     }

  //     const accountLink = await stripe.accountLinks.create({
  //       account: account.id,
  //       refresh_url:
  //         `${APP_DOMAIN}` +
  //         `${workspace.slug}/${project.slug}/settings/billing`,
  //       return_url: `${APP_DOMAIN}` + `${workspace.slug}/${project.slug}/`,
  //       type: "account_onboarding",
  //       collect: "currently_due",
  //     })

  //     // save the account id to the project
  //     await opts.ctx.db.update(projects).set({
  //       stripeAccountId: account.id,
  //     })

  //     if (!accountLink.url) return { success: false as const, url: "" }
  //     return { success: true as const, url: accountLink.url }
  //   }),
  // TODO: add output and migrate to plans endpoint
  plans: rateLimiterProcedure.input(z.void()).query(async (opts) => {
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
              slug: plan.slug,
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
  }),

  // TODO: delete this just for testing
  dinero: rateLimiterProcedure.input(z.void()).query(async (opts) => {
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
  }),
})
