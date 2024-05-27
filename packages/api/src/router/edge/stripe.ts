import * as currencies from "@dinero.js/currencies"
import { TRPCError } from "@trpc/server"
import { dinero } from "dinero.js"
import { z } from "zod"

import { API_DOMAIN, APP_DOMAIN, PLANS } from "@builderai/config"
import { projects } from "@builderai/db/schema"
import { purchaseWorkspaceSchema } from "@builderai/db/validators"
import type { Stripe } from "@builderai/stripe"
import { stripe } from "@builderai/stripe"

import {
  createTRPCRouter,
  protectedActiveProjectProcedure,
  protectedActiveWorkspaceProcedure,
  publicProcedure,
} from "../../trpc"

export const stripeRouter = createTRPCRouter({
  createLinkAccount: protectedActiveProjectProcedure
    .input(z.void())
    .output(
      z.object({
        success: z.boolean(),
        url: z.string(),
      })
    )
    .mutation(async (opts) => {
      const user = opts.ctx.session.user
      const project = opts.ctx.project
      const workspace = opts.ctx.workspace

      const accountId = project.stripeAccountId
      let account

      if (!accountId) {
        account = await stripe.accounts.create({
          type: "standard",
          email: user.email ?? "",
          country: "DE", // TODO: fix country
          capabilities: {
            card_payments: { requested: false },
            transfers: { requested: false },
          },
        })
      } else {
        account = await stripe.accounts.retrieve(accountId)
      }

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url:
          `${APP_DOMAIN}` +
          `${workspace.slug}/${project.slug}/settings/billing`,
        return_url: `${APP_DOMAIN}` + `${workspace.slug}/${project.slug}/`,
        type: "account_onboarding",
        collect: "currently_due",
      })

      // save the account id to the project
      await opts.ctx.db.update(projects).set({
        stripeAccountId: account.id,
      })

      if (!accountLink.url) return { success: false as const, url: "" }
      return { success: true as const, url: accountLink.url }
    }),
  createSession: protectedActiveWorkspaceProcedure
    .input(z.object({ planId: z.string() }))
    .output(z.object({ success: z.boolean(), url: z.string() }))
    .mutation(async (opts) => {
      const workspace = opts.ctx.workspace
      const user = opts.ctx.session.user
      // TODO: fix returnUrl
      const returnUrl = `${APP_DOMAIN}` + "/"

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

      if (!session.url) return { success: false as const, url: "" }
      return { success: true as const, url: session.url }
    }),
  listPaymentMethods: protectedActiveProjectProcedure
    .input(
      z.object({
        customerId: z.string(),
      })
    )
    .output(
      z.object({
        paymentMethods: z.custom<Stripe.PaymentMethod>().array(),
      })
    )
    .query(async (opts) => {
      const { customerId } = opts.input

      const customerData = await opts.ctx.db.query.customers.findFirst({
        where: (customer, { and, eq }) =>
          and(
            eq(customer.id, customerId),
            eq(customer.projectId, opts.ctx.project.id)
          ),
      })

      if (!customerData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Customer not found",
        })
      }

      const stripeCustomerId =
        customerData.metadata?.metadataPaymentProviderSchema?.stripe?.customerId

      if (!stripeCustomerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Stripe configuration not found for this customer",
        })
      }

      const paymentMethods =
        await stripe.customers.listPaymentMethods(stripeCustomerId)

      return {
        paymentMethods: paymentMethods.data,
      }
    }),

  createPaymentMethod: protectedActiveProjectProcedure
    .input(
      z.object({
        customerId: z.string(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .output(z.object({ success: z.boolean(), url: z.string() }))
    .mutation(async (opts) => {
      const project = opts.ctx.project
      const { successUrl, cancelUrl, customerId } = opts.input

      const customerData = await opts.ctx.db.query.customers.findFirst({
        where: (customer, { and, eq }) =>
          and(eq(customer.id, customerId), eq(customer.projectId, project.id)),
      })

      if (!customerData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Customer not found",
        })
      }

      // do not use `new URL(...).searchParams` here, because it will escape the curly braces and stripe will not replace them with the session id
      const apiCallbackUrl = `${API_DOMAIN}/stripe.callback?session_id={CHECKOUT_SESSION_ID}`

      // TODO: check if customer has a payment method already

      // create a new session for registering a payment method
      const session = await stripe.checkout.sessions.create({
        client_reference_id: customerData.id,
        customer_email: customerData.email,
        billing_address_collection: "auto",
        mode: "setup",
        metadata: {
          successUrl,
          cancelUrl,
          customerId,
          projectId: project.id,
        },
        success_url: apiCallbackUrl,
        cancel_url: cancelUrl,
        currency: "USD", // TODO: fix currency with project currency
        customer_creation: "always",
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
    .output(z.object({ success: z.boolean(), url: z.string() }))
    .mutation(async (opts) => {
      const { name: workspaceName, planId } = opts.input
      const user = opts.ctx.session.user

      // TODO: fix returnUrl
      const returnUrl = `${APP_DOMAIN}` + "/"

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
