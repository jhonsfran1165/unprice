import { task } from "@trigger.dev/sdk/v3"
import { SubscriptionService } from "@unprice/api/services/subscriptions"
import { createContext } from "./context"

export const cancelTask = task({
  id: "subscription.cancel",
  retry: {
    maxAttempts: 1,
  },
  run: async (
    {
      subscriptionId,
      projectId,
      now,
      cancelAt,
      phaseId,
    }: {
      subscriptionId: string
      projectId: string
      now: number
      cancelAt?: number
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
        api: "jobs.subscription.cancel",
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

    console.info("Cancelling subscription", {
      subscriptionId,
      projectId,
      now,
      cancelAt,
      phaseId,
    })

    // TODO: cancel the subscription
    return true
  },
})
