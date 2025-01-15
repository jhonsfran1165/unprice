import { task } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { AesGCM } from "@unprice/db/utils"
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
        and(
          eq(table.id, invoice.subscriptionPhaseId),
          eq(table.projectId, projectId),
          eq(table.active, true)
        ),
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

    // get config payment provider
    const config = await db.query.paymentProviderConfig.findFirst({
      where: (config, { and, eq }) =>
        and(
          eq(config.projectId, projectId),
          eq(config.paymentProvider, subscriptionPhase.planVersion.paymentProvider),
          eq(config.active, true)
        ),
    })

    if (!config) {
      throw new Error("Payment provider config not found or not active")
    }

    const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

    const paymentProviderToken = await aesGCM.decrypt({
      iv: config.keyIv,
      ciphertext: config.key,
    })

    const phaseMachine = new PhaseMachine({
      db: db,
      phase: subscriptionPhase,
      subscription: subscriptionPhase.subscription,
      customer: subscriptionPhase.subscription.customer,
      analytics: tinybird,
      logger: logger,
      paymentProviderToken,
    })

    const invoiceMachine = new InvoiceStateMachine({
      db: db,
      phaseMachine: phaseMachine,
      logger: logger,
      analytics: tinybird,
      invoice: invoice,
      paymentProviderToken,
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
