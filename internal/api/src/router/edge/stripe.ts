import * as currencies from "@dinero.js/currencies"
import { TRPCError } from "@trpc/server"
import { dinero } from "dinero.js"
import { z } from "zod"

import { APP_DOMAIN, PLANS } from "@builderai/config"
import { calculatePricePerFeature, purchaseWorkspaceSchema } from "@builderai/db/validators"
import { stripe } from "@builderai/stripe"

import { and, eq } from "@builderai/db"
import { features, planVersionFeatures } from "@builderai/db/schema"
import { toStripeMoney } from "@builderai/db/utils"
import { createTRPCRouter, protectedActiveWorkspaceProcedure, publicProcedure } from "../../trpc"

export const stripeRouter = createTRPCRouter({
  // createLinkAccount: protectedActiveProjectProcedure
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
  createSession: protectedActiveWorkspaceProcedure
    .input(z.object({ planId: z.string() }))
    .output(z.object({ success: z.boolean(), url: z.string() }))
    .mutation(async (opts) => {
      const workspace = opts.ctx.workspace
      const user = opts.ctx.session.user
      // TODO: fix returnUrl
      const returnUrl = `${APP_DOMAIN}/`

      if (!user?.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is not defined",
        })
      }

      if (workspace && workspace.plan !== "FREE" && workspace.unPriceCustomerId) {
        /**
         * User is subscribed, create a billing portal session
         */
        const session = await stripe.billingPortal.sessions.create({
          customer: workspace.unPriceCustomerId ?? "",
          return_url: returnUrl,
        })
        return { success: true as const, url: session.url }
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: user.email,
        client_reference_id: user.id,
        subscription_data: {
          metadata: { userId: user.id },
        },
        cancel_url: returnUrl,
        success_url: returnUrl,
        line_items: [{ price: PLANS.PRO?.priceId, quantity: 1 }],
      })

      if (!session.url) return { success: false as const, url: "" }
      return { success: true as const, url: session.url }
    }),

  // TODO: add output
  plans: publicProcedure.input(z.void()).query(async () => {
    // TODO: fix priceId
    const proPrice = await stripe.prices.retrieve(PLANS.PRO?.priceId ?? "")
    const stdPrice = await stripe.prices.retrieve(PLANS.STANDARD?.priceId ?? "")

    return [
      {
        ...PLANS.STANDARD,
        price: dinero({
          amount: stdPrice.unit_amount!,
          currency: currencies[stdPrice.currency as keyof typeof currencies] ?? currencies.USD,
        }),
      },
      {
        ...PLANS.PRO,
        price: dinero({
          amount: proPrice.unit_amount!,
          currency: currencies[proPrice.currency as keyof typeof currencies] ?? currencies.USD,
        }),
      },
    ]
  }),

  // TODO: delete this just for testing
  dinero: publicProcedure.input(z.void()).query(async (opts) => {
    // TODO: fix priceId

    const now = new Date()

    // Get the start of the current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get the end of the current month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const usageTiny = await opts.ctx.analytics
      .getUsageFeature({
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

  purchaseOrg: protectedActiveWorkspaceProcedure
    .input(purchaseWorkspaceSchema)
    .output(z.object({ success: z.boolean(), url: z.string() }))
    .mutation(async (opts) => {
      const { name: workspaceName, planId } = opts.input
      const user = opts.ctx.session.user

      // TODO: fix returnUrl
      const returnUrl = `${APP_DOMAIN}/`

      if (!returnUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "returnUrl is not defined",
        })
      }

      if (!user?.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is not defined",
        })
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user?.email,
        payment_method_types: ["card"],
        client_reference_id: user?.id,
        subscription_data: {
          metadata: {
            userId: user?.id,
            workspaceName: workspaceName,
          },
        },
        success_url: returnUrl,
        cancel_url: returnUrl,
        line_items: [{ price: planId, quantity: 1 }],
      })

      if (!session.url) return { success: false as const, url: "" }
      return { success: true as const, url: session.url }
    }),
})
