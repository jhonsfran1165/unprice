import * as currencies from "@dinero.js/currencies"
import { TRPCError } from "@trpc/server"
import { dinero } from "dinero.js"
import * as z from "zod"

import { currentUser } from "@builderai/auth"
import { PLANS } from "@builderai/config"
import { purchaseWorkspaceSchema } from "@builderai/db/schema/workspace"
import { stripe } from "@builderai/stripe"

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc"

export const stripeRouter = createTRPCRouter({
  createSession: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async (opts) => {
      const { userId } = opts.ctx.auth

      const workspace = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.workspace.findFirst({
          columns: {
            id: true,
            plan: true,
            stripeId: true,
          },
          where: (workspace, { eq }) =>
            eq(workspace.tenantId, opts.ctx.tenantId),
        })
      })

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found or you don't have access",
        })
      }

      const returnUrl = process.env.NEXTJS_URL + "/"

      if (workspace && workspace.plan !== "FREE" && workspace.stripeId) {
        /**
         * User is subscribed, create a billing portal session
         */
        const session = await stripe.billingPortal.sessions.create({
          customer: workspace.stripeId,
          return_url: returnUrl,
        })
        return { success: true as const, url: session.url }
      }

      /**
       * User is not subscribed, create a checkout session
       * Use existing email address if available
       */

      const user = await currentUser()
      const email = user?.emailAddresses.find(
        (addr) => addr.id === user?.primaryEmailAddressId
      )?.emailAddress

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: email,
        client_reference_id: userId,
        subscription_data: {
          metadata: { tenantId: opts.ctx.tenantId, userId },
        },
        cancel_url: returnUrl,
        success_url: returnUrl,
        line_items: [{ price: PLANS.PRO?.priceId, quantity: 1 }],
      })

      if (!session.url) return { success: false as const }
      return { success: true as const, url: session.url }
    }),

  plans: publicProcedure.query(async () => {
    // TODO: fix priceId
    const proPrice = await stripe.prices.retrieve(PLANS.PRO?.priceId ?? "")
    const stdPrice = await stripe.prices.retrieve(PLANS.STANDARD?.priceId ?? "")

    return [
      {
        ...PLANS.STANDARD,
        price: dinero({
          amount: stdPrice.unit_amount!,
          currency:
            currencies[stdPrice.currency as keyof typeof currencies] ??
            currencies.USD,
        }),
      },
      {
        ...PLANS.PRO,
        price: dinero({
          amount: proPrice.unit_amount!,
          currency:
            currencies[proPrice.currency as keyof typeof currencies] ??
            currencies.USD,
        }),
      },
    ]
  }),

  purchaseOrg: protectedProcedure
    .input(purchaseWorkspaceSchema)
    .mutation(async (opts) => {
      const { userId } = opts.ctx.auth
      const { orgName, planId } = opts.input

      const returnUrl = process.env.NEXTJS_URL + "/"

      if (!returnUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "returnUrl is not defined",
        })
      }

      const user = await currentUser()
      const email = user?.emailAddresses.find(
        (addr) => addr.id === user?.primaryEmailAddressId
      )?.emailAddress

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: email,
        payment_method_types: ["card"],
        client_reference_id: userId,
        subscription_data: {
          metadata: {
            userId,
            organizationName: orgName,
            tenantId: opts.ctx.tenantId,
          },
        },
        success_url: returnUrl,
        cancel_url: returnUrl,
        line_items: [{ price: planId, quantity: 1 }],
      })

      if (!session.url) return { success: false as const }
      return { success: true as const, url: session.url }
    }),
})
