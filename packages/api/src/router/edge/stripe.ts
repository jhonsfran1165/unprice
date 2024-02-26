import * as currencies from "@dinero.js/currencies"
import { TRPCError } from "@trpc/server"
import { dinero } from "dinero.js"
import { z } from "zod"

import { PLANS } from "@builderai/config"
import { stripe } from "@builderai/stripe"
import { purchaseWorkspaceSchema } from "@builderai/validators/workspace"

import {
  createTRPCRouter,
  protectedActiveWorkspaceProcedure,
  publicProcedure,
} from "../../trpc"

export const stripeRouter = createTRPCRouter({
  createSession: protectedActiveWorkspaceProcedure
    .input(z.object({ planId: z.string() }))
    .output(z.object({ success: z.boolean(), url: z.string().optional() }))
    .mutation(async (opts) => {
      const workspace = opts.ctx.workspace
      const user = opts.ctx.session.user
      const returnUrl = process.env.NEXTJS_URL + "/"

      if (!user?.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is not defined",
        })
      }

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

      if (!session.url) return { success: false as const }
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

  purchaseOrg: protectedActiveWorkspaceProcedure
    .input(purchaseWorkspaceSchema)
    .output(z.object({ success: z.boolean(), url: z.string().optional() }))
    .mutation(async (opts) => {
      const { name: workspaceName, planId } = opts.input
      const user = opts.ctx.session.user

      const returnUrl = process.env.NEXTJS_URL + "/"

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

      if (!session.url) return { success: false as const }
      return { success: true as const, url: session.url }
    }),
})
