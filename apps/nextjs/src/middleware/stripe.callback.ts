import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { and, db, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import { stripe } from "@builderai/stripe"

// TODO: report logs
export default async function StripeMiddleware(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    )
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  if (!session.metadata) {
    return NextResponse.json(
      { error: "Session metadata is required" },
      { status: 400 }
    )
  }

  const customerId = session?.metadata?.customerId
  const projectId = session?.metadata?.projectId
  const successUrl = session?.metadata?.successUrl
  const cancelUrl = session?.metadata?.cancelUrl

  if (!customerId || !projectId || !successUrl || !cancelUrl) {
    return NextResponse.json(
      { error: "Metadata is incomplete" },
      { status: 400 }
    )
  }

  const customer = await stripe.customers.retrieve(session.customer as string)

  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found in stripe" },
      { status: 404 }
    )
  }

  // check if the customer exists in the database
  const customerData = await db.query.customers.findFirst({
    where: (customer, { and, eq }) =>
      and(eq(customer.id, customerId), eq(customer.projectId, projectId)),
  })

  if (!customerData) {
    return NextResponse.json(
      { error: "Customer not found in database" },
      { status: 404 }
    )
  }

  // if all checks pass, update the customer metadata with the stripe subscription id
  await db
    .update(schema.customers)
    .set({
      metadata: {
        ...customerData.metadata,
        metadataPaymentProviderSchema: {
          stripe: {
            customerId: customer.id,
            stripeSubscriptionId: session.subscription! as string,
          },
        },
      },
    })
    .where(
      and(
        eq(schema.customers.id, customerData.id),
        eq(schema.customers.projectId, customerData.projectId)
      )
    )

  // redirect the user to the success URL
  return NextResponse.redirect(successUrl)
}
