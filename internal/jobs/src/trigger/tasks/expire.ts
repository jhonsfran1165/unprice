import { task } from "@trigger.dev/sdk/v3"
import { SubscriptionService } from "@unprice/api/services/subscriptions"
import { createContext } from "./context"

export const expireTask = task({
  id: "subscription.expire",
  retry: {
    maxAttempts: 1,
  },
  run: async (
    {
      subscriptionId,
      projectId,
      now,
      expiresAt,
      phaseId,
    }: {
      subscriptionId: string
      projectId: string
      now: number
      expiresAt?: number
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
        api: "jobs.subscription.expire",
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

    // we have to throw if there is an error so the task fails
    // if (result.err) {
    //   throw result.err
    // }

    console.info("Expiring subscription", {
      subscriptionId,
      projectId,
      now,
      expiresAt,
      phaseId,
    })

    // TODO: expire the subscription
    return true
  },
})
