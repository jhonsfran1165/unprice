import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { and, db, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { ratelimitOrThrow } from "~/lib/ratelimit"
import { api } from "~/trpc/server"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

// this route is called by stripe after the customer creates a payment method
// it is used to update the customer in the database and redirect the user to the success URL
// usually used for the first time a customer creates a payment method
export async function GET(req: NextRequest) {
  try {
    await ratelimitOrThrow(req, "stripe-setup")

    const sessionId = req.nextUrl.searchParams.get("session_id")
    const projId = req.nextUrl.searchParams.get("project_id")

    if (!sessionId || !projId) {
      return NextResponse.json({ error: "Session ID and project ID are required" }, { status: 400 })
    }

    // get session
    const {
      metadata,
      subscriptionId,
      paymentMethodId,
      customerId: stripeCustomerId,
    } = await api.paymentProvider.getSession({
      sessionId,
      paymentProvider: "stripe",
      projectId: projId,
    })

    if (!metadata) {
      return NextResponse.json({ error: "Session not metadata" }, { status: 404 })
    }

    const customerId = metadata.customerId
    const projectId = metadata.projectId
    const successUrl = metadata.successUrl
    const cancelUrl = metadata.cancelUrl

    if (!customerId || !projectId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Metadata is incomplete" }, { status: 400 })
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
        stripeCustomerId: stripeCustomerId,
        metadata: {
          ...customerData?.metadata,
          stripeSubscriptionId: subscriptionId ?? "",
          stripeDefaultPaymentMethodId: paymentMethodId ?? "",
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
