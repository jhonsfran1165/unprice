import { task } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { ConsoleLogger } from "@unprice/logging"
import { InvoiceStateMachine, PhaseMachine } from "@unprice/services/subscriptions"
import { Analytics } from "@unprice/tinybird"
import { env } from "../../env.mjs"

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
    const tinybird = new Analytics({
      emit: true,
      tinybirdToken: env.TINYBIRD_TOKEN,
    })

    const logger = new ConsoleLogger({
      requestId: ctx.task.id,
      defaultFields: {
        subscriptionPhaseId,
        invoiceId,
        projectId,
        api: "jobs.subscription.phase.billing",
      },
    })

    const invoice = await db.query.invoices.findFirst({
      where: (table, { eq, and }) => and(eq(table.id, invoiceId), eq(table.projectId, projectId)),
    })

    if (!invoice) {
      throw new Error("Invoice not found")
    }

    const subscriptionPhase = await db.query.subscriptionPhases.findFirst({
      with: {
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
      throw new Error("Subscription phase not found")
    }

    if (!subscriptionPhase.subscription) {
      throw new Error("Subscription not found")
    }

    if (!subscriptionPhase.subscription.customer) {
      throw new Error("Customer not found")
    }

    const phaseMachine = new PhaseMachine({
      db: db,
      phase: subscriptionPhase,
      subscription: subscriptionPhase.subscription,
      customer: subscriptionPhase.subscription.customer,
      analytics: tinybird,
      logger: logger,
    })

    const invoiceMachine = new InvoiceStateMachine({
      db: db,
      phaseMachine: phaseMachine,
      logger: logger,
      analytics: tinybird,
      invoice: invoice,
    })

    const result = await invoiceMachine.transition("COLLECT_PAYMENT", {
      invoiceId,
      autoFinalize: true,
      now,
    })

    // we have to throw if there is an error so the task fails
    if (result.err) {
      throw result.err
    }

    return result.val
  },
})
