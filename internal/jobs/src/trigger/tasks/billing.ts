import { task } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"

export const billingTask = task({
  id: "subscription.phase.billing",
  retry: {
    maxAttempts: 1,
  },
  run: async (
    {
      subscriptionPhaseId,
      invoiceId,
      projectId,
      now,
    }: {
      subscriptionPhaseId: string
      projectId: string
      invoiceId: string
      now: number
    },
    { ctx }
  ) => {
    const invoice = await db.query.invoices.findFirst({
      where: (table, { eq, and }) => and(eq(table.id, invoiceId), eq(table.projectId, projectId)),
    })

    if (!invoice) {
      throw new Error("Invoice not found")
    }

    const subscriptionPhase = await db.query.subscriptionPhases.findFirst({
      with: {
        project: true,
        subscription: {
          with: {
            customer: true,
          },
        },
        items: {
          with: {
            featurePlanVersion: {
              with: {
                feature: true,
              },
            },
          },
        },
        planVersion: {
          with: {
            planFeatures: true,
          },
        },
      },
      where: (table, { eq, and }) =>
        and(eq(table.id, invoice.subscriptionPhaseId), eq(table.projectId, projectId)),
    })

    if (!subscriptionPhase) {
      throw new Error("Subscription phase not found or not active")
    }

    if (!subscriptionPhase.subscription) {
      throw new Error("Subscription not found or not active")
    }

    if (!subscriptionPhase.subscription.customer) {
      throw new Error("Customer not found")
    }

    console.info("Billing subscription", {
      subscriptionPhaseId,
      invoiceId,
      projectId,
      now,
      taskId: ctx.task.id
    })

    // TODO: billing the subscription
    return true
  },
})
