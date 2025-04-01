import { task } from "@trigger.dev/sdk/v3"
import { SubscriptionService } from "@unprice/services/subscriptions"
import { createContext } from "./context"

export const finilizeTask = task({
  id: "subscription.phase.finilize",
  retry: {
    maxAttempts: 1,
  },
  run: async (
    {
      subscriptionPhaseId,
      invoiceId,
      projectId,
      now,
      subscriptionId,
    }: {
      subscriptionPhaseId: string
      projectId: string
      invoiceId: string
      now: number
      subscriptionId: string
    },
    { ctx }
  ) => {
    const context = await createContext({
      taskId: ctx.task.id,
      subscriptionId,
      projectId,
      phaseId: subscriptionPhaseId,
      defaultFields: {
        subscriptionId,
        projectId,
        api: "jobs.subscription.phase.billing",
        subscriptionPhaseId,
        invoiceId,
        now: now.toString(),
      },
    })

    const subscriptionService = new SubscriptionService(context)

    const finalizeInvoiceResult = await subscriptionService.finalizeInvoice({
      invoiceId,
      projectId,
      subscriptionId,
      now,
    })

    if (finalizeInvoiceResult.err) {
      throw finalizeInvoiceResult.err
    }

    return {
      status: finalizeInvoiceResult.val.status,
      subscriptionId,
      projectId,
      now,
      subscriptionPhaseId,
    }
  },
})
