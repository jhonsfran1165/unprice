import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { and, db, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { type Stripe, stripe } from "@unprice/stripe"
import { ratelimitOrThrow } from "~/lib/ratelimit"
import { api } from "~/trpc/server"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

// this is going to be called by stripe when the user completes the signup process
// once the registration is complete we create a new customer in the database
// then we subscribe the customer to the plan
// then we redirect the user to the success URL
export async function GET(req: NextRequest) {
  try {
    await ratelimitOrThrow(req, "stripe-signup")

    const sessionId = req.nextUrl.searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    if (!session.metadata) {
      return NextResponse.json({ error: "Session metadata is required" }, { status: 400 })
    }

    const customerSessionId = session.metadata?.customerSessionId as string
    const successUrl = session.metadata?.successUrl as string
    const cancelUrl = session.metadata?.cancelUrl as string

    if (!customerSessionId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Metadata is incomplete" }, { status: 400 })
    }

    // get the customer session
    const customerSession = await db.query.customerSessions.findFirst({
      where: eq(schema.customerSessions.id, customerSessionId),
    })

    if (!customerSession) {
      return NextResponse.json({ error: "Customer session not found" }, { status: 404 })
    }

    const [customer, paymentMethods] = await Promise.all([
      stripe.customers.retrieve(session.customer as string) as Promise<Stripe.Customer>,
      stripe.customers.listPaymentMethods(session.customer as string),
    ])

    if (!customer.id) {
      return NextResponse.json({ error: "Customer not found in stripe" }, { status: 404 })
    }

    // check if the customer exists in the database
    const customerUnprice = await db.query.customers.findFirst({
      where: (customer, { and, eq }) =>
        and(
          eq(customer.id, customerSession.customer.id),
          eq(customer.projectId, customerSession.customer.projectId)
        ),
    })

    if (!customerUnprice) {
      // if the customer does not exist in the database, create it
      await db
        .insert(schema.customers)
        .values({
          id: customerSession.customer.id,
          projectId: customerSession.customer.projectId,
          stripeCustomerId: customer.id,
          name: customerSession.customer.name ?? customer.name ?? "",
          email: customerSession.customer.email ?? customer.email ?? "",
          defaultCurrency: customerSession.customer.currency,
          active: true,
          timezone: customerSession.customer.timezone,
          metadata: {
            stripeSubscriptionId: (session.subscription as string) ?? "",
            stripeDefaultPaymentMethodId: paymentMethods.data.at(0)?.id ?? "",
            externalId: customerSession.customer.externalId,
          },
        })
        .execute()
    } else {
      await db
        .update(schema.customers)
        .set({
          stripeCustomerId: session.customer as string,
          name: customerSession.customer.name ?? customer.name ?? "",
          email: customerSession.customer.email ?? customer.email ?? "",
          defaultCurrency: customerSession.customer.currency,
          active: true,
          timezone: customerSession.customer.timezone,
          metadata: {
            ...customerUnprice.metadata,
            stripeSubscriptionId: (session.subscription as string) ?? "",
            stripeDefaultPaymentMethodId: paymentMethods.data.at(0)?.id ?? "",
            externalId: customerSession.customer.externalId,
          },
        })
        .where(
          and(
            eq(schema.customers.id, customerUnprice.id),
            eq(schema.customers.projectId, customerUnprice.projectId)
          )
        )
        .execute()
    }

    // create the subscription
    await api.subscriptions.signUp({
      customerId: customerSession.customer.id,
      projectId: customerSession.customer.projectId,
      phases: [
        {
          startAt: Date.now(),
          planVersionId: customerSession.planVersion.id,
          config: customerSession.planVersion.config,
          paymentMethodId: paymentMethods.data.at(0)?.id ?? "",
        },
      ],
      // trialDays: planVersion.trialDays,
    })

    // redirect the user to the success URL
    return NextResponse.redirect(successUrl)
  } catch (error) {
    // TODO: add logs and notifications if errors occur
    const e = error as Error
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
