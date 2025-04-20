import { task } from "@trigger.dev/sdk/v3"
import { SubscriptionService } from "@unprice/services/subscriptions"
import { createContext } from "./context"

export const invoiceTask = task({
  id: "subscription.phase.invoice",
  retry: {
    maxAttempts: 3,
  },
  run: async (
    {
      subscriptionId,
      projectId,
      now,
      phaseId,
    }: {
      subscriptionId: string
      projectId: string
      now: number
      phaseId: string
    },
    { ctx }
  ) => {
    const context = await createContext({
      taskId: ctx.task.id,
      subscriptionId,
      projectId,
      phaseId,
      defaultFields: {
        subscriptionId,
        projectId,
        api: "jobs.subscription.phase.invoice",
        phaseId,
        now: now.toString(),
      },
    })

    const subscriptionService = new SubscriptionService(context)

    // init phase machine
    const billingInvoiceResult = await subscriptionService.invoiceSubscription({
      subscriptionId,
      projectId,
      now,
    })

    if (billingInvoiceResult.err) {
      throw billingInvoiceResult.err
    }

    return {
      status: billingInvoiceResult.val.status,
    }
  },
})
