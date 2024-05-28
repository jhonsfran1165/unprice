import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { db, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import { stripe } from "@builderai/stripe"

export async function GET(req: NextRequest) {
  // TODO: add rate limiting
  const sessionId = req.nextUrl.searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    )
  }

  // TODO: add logs and notifications if errors occur
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

  const [customer, paymentMethods] = await Promise.all([
    stripe.customers.retrieve(session.customer as string),
    stripe.customers.listPaymentMethods(session.customer as string),
  ])

  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found in stripe" },
      { status: 404 }
    )
  }

  // check if the customer exists in the database
  const customerData = await db.query.customers.findFirst({
    with: {
      providers: {
        where: (provider, { eq }) => eq(provider.paymentProvider, "stripe"),
      },
    },
    where: (customer, { and, eq }) =>
      and(eq(customer.id, customerId), eq(customer.projectId, projectId)),
  })

  if (!customerData) {
    return NextResponse.json(
      { error: "Customer not found in database" },
      { status: 404 }
    )
  }

  const paymentProviderData = customerData.providers.at(0)

  if (!paymentProviderData) {
    // TODO: it would be a good idea to waitUntil here?
    const id = utils.newId("customer_provider")
    // if all checks pass, update the customer metadata with the stripe subscription id
    await db
      .insert(schema.customerPaymentProviders)
      .values({
        id: id,
        customerId: customerData.id,
        projectId: customerData.projectId,
        paymentProvider: "stripe",
        paymentProviderCustomerId: customer.id,
        defaultPaymentMethodId: paymentMethods.data.at(0)?.id ?? "",
        metadata: {
          stripeSubscriptionId: (session.subscription as string) ?? "",
        },
      })
      .execute()
  } else {
    await db
      .update(schema.customerPaymentProviders)
      .set({
        defaultPaymentMethodId: paymentMethods.data.at(0)?.id,
      })
      .where(eq(schema.customerPaymentProviders.id, paymentProviderData.id))
  }
  // redirect the user to the success URL
  return NextResponse.redirect(successUrl)
}
