import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { and, db, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { type Stripe, stripe } from "@unprice/stripe"
import { ratelimitOrThrow } from "~/lib/ratelimit"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

// this route is called by stripe after the customer creates a payment method
// it is used to update the customer in the database and redirect the user to the success URL
// usually used for the first time a customer creates a payment method
export async function GET(req: NextRequest) {
  try {
    await ratelimitOrThrow(req, "stripe-setup")

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

    const customerId = session?.metadata?.customerId
    const projectId = session?.metadata?.projectId
    const successUrl = session?.metadata?.successUrl
    const cancelUrl = session?.metadata?.cancelUrl

    if (!customerId || !projectId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Metadata is incomplete" }, { status: 400 })
    }

    const [customer, paymentMethods] = await Promise.all([
      stripe.customers.retrieve(session.customer as string) as Promise<Stripe.Customer>,
      stripe.customers.listPaymentMethods(session.customer as string),
    ])

    if (!customer.id) {
      return NextResponse.json({ error: "Customer not found in stripe" }, { status: 404 })
    }

    // check if the customer exists in the database
    const customerData = await db.query.customers.findFirst({
      where: (customer, { and, eq }) =>
        and(eq(customer.id, customerId), eq(customer.projectId, projectId)),
    })

    if (!customerData) {
      return NextResponse.json({ error: "Customer not found in database" }, { status: 404 })
    }

    await db
      .update(schema.customers)
      .set({
        stripeCustomerId: session.customer as string,
        metadata: {
          ...customerData?.metadata,
          stripeSubscriptionId: (session.subscription as string) ?? "",
          stripeDefaultPaymentMethodId: paymentMethods.data.at(0)?.id ?? "",
        },
      })
      .where(
        and(eq(schema.customers.id, customerData.id), eq(schema.customers.projectId, projectId))
      )
      .execute()

    // redirect the user to the success URL
    return NextResponse.redirect(successUrl)
  } catch (error) {
    // TODO: add logs and notifications if errors occur
    const e = error as Error
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
