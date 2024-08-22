import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { and, db, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { stripePlanVersionSchema, stripeSetupSchema } from "@unprice/db/validators"
import { type Stripe, stripe } from "@unprice/stripe"
import { api } from "~/trpc/server"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

// this is going to be called by stripe when the user completes the signup process
// once the registration is complete we create a new customer in the database
// then we subscribe the customer to the plan
// then we redirect the user to the success URL
export async function GET(req: NextRequest) {
  // TODO: add rate limiting
  const sessionId = req.nextUrl.searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
  }

  // TODO: add logs and notifications if errors occur
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  if (!session.metadata) {
    return NextResponse.json({ error: "Session metadata is required" }, { status: 400 })
  }

  const customerMetadata = JSON.parse(session.metadata?.customer as string)
  const planVersionMetadata = JSON.parse(session.metadata?.planVersion as string)
  const successUrl = session.metadata?.successUrl
  const cancelUrl = session.metadata?.cancelUrl

  if (!customerMetadata || !successUrl || !cancelUrl) {
    return NextResponse.json({ error: "Metadata is incomplete" }, { status: 400 })
  }

  const [customer, paymentMethods] = await Promise.all([
    stripe.customers.retrieve(session.customer as string) as Promise<Stripe.Customer>,
    stripe.customers.listPaymentMethods(session.customer as string),
  ])

  if (!customer.id) {
    return NextResponse.json({ error: "Customer not found in stripe" }, { status: 404 })
  }

  const { success, data: stripeSetupCustomer } = stripeSetupSchema.safeParse(customerMetadata)
  const { success: planVersionSuccess, data: planVersion } =
    stripePlanVersionSchema.safeParse(planVersionMetadata)

  if (!success || !stripeSetupCustomer) {
    return NextResponse.json({ error: "Customer metadata is invalid" }, { status: 400 })
  }

  if (!planVersionSuccess || !planVersion) {
    return NextResponse.json({ error: "Plan version metadata is invalid" }, { status: 400 })
  }

  // check if the customer exists in the database
  const customerUnprice = await db.query.customers.findFirst({
    where: (customer, { and, eq }) =>
      and(
        eq(customer.id, stripeSetupCustomer.id),
        eq(customer.projectId, stripeSetupCustomer.projectId)
      ),
  })

  if (!customerUnprice) {
    // if the customer does not exist in the database, create it
    await db
      .insert(schema.customers)
      .values({
        id: stripeSetupCustomer.id,
        projectId: stripeSetupCustomer.projectId,
        stripeCustomerId: customer.id,
        name: stripeSetupCustomer.name ?? customer.name ?? "",
        email: stripeSetupCustomer.email ?? customer.email ?? "",
        defaultCurrency: stripeSetupCustomer.currency,
        active: true,
        timezone: stripeSetupCustomer.timezone,
        metadata: {
          stripeSubscriptionId: (session.subscription as string) ?? "",
          stripeDefaultPaymentMethodId: paymentMethods.data.at(0)?.id ?? "",
        },
      })
      .execute()
  } else {
    await db
      .update(schema.customers)
      .set({
        stripeCustomerId: session.customer as string,
        metadata: {
          ...customerUnprice.metadata,
          stripeSubscriptionId: (session.subscription as string) ?? "",
          stripeDefaultPaymentMethodId: paymentMethods.data.at(0)?.id ?? "",
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
    customerId: stripeSetupCustomer.id,
    projectId: stripeSetupCustomer.projectId,
    type: "plan",
    planVersionId: planVersion.id,
    startDateAt: Date.now(),
    status: "active",
    config: planVersion.config,
    defaultPaymentMethodId: paymentMethods.data.at(0)?.id ?? "",
    // trialDays: planVersion.trialDays,
  })

  // redirect the user to the success URL
  return NextResponse.redirect(successUrl)
}
