import { task } from "@trigger.dev/sdk/v3"
import { SubscriptionService } from "#services/subscriptions"
import { createContext } from "./context"

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

    const billingResult = await subscriptionService.billingInvoice({
      invoiceId,
      projectId,
      subscriptionId,
      now,
    })

    if (billingResult.err) {
      throw billingResult.err
    }

    return {
      status: billingResult.val.status,
      subscriptionId,
      projectId,
      now,
      subscriptionPhaseId,
    }
  },
})
