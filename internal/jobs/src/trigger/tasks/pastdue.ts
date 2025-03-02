import { task } from "@trigger.dev/sdk/v3"
import { SubscriptionService } from "@unprice/api/services/subscriptions"
import { createContext } from "./context"

export const pastDueTask = task({
  id: "subscription.pastdue",
  retry: {
    maxAttempts: 1,
  },
  run: async (
    {
      subscriptionId,
      projectId,
      now,
      pastDueAt,
      phaseId,
    }: {
      subscriptionId: string
      projectId: string
      now: number
      pastDueAt?: number
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
        api: "jobs.invoice.pastdue",
        phaseId,
      },
    })

    const subscriptionService = new SubscriptionService(context)

    // init phase machine
    const initPhaseMachineResult = await subscriptionService.initPhaseMachines({
      subscriptionId,
      projectId,
    })

    if (initPhaseMachineResult.err) {
      throw initPhaseMachineResult.err
    }

    console.info("Past due", {
      subscriptionId,
      projectId,
      now,
      pastDueAt,
      phaseId,
    })

    // TODO: past due the subscription
    return true
  },
})
