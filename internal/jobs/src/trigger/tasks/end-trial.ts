import { task } from "@trigger.dev/sdk/v3"
import { SubscriptionService } from "@unprice/api/services/subscriptions"
import { createContext } from "./context"

export const endTrialTask = task({
  id: "subscription.endtrial",
  retry: {
    maxAttempts: 1,
  },
  run: async (
    {
      subscriptionId,
      phaseId,
      projectId,
      now,
    }: {
      subscriptionId: string
      phaseId: string
      projectId: string
      now: number
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
        api: "jobs.subscription.endtrial",
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

    const result = await subscriptionService.endSubscriptionTrial({
      now,
    })

    // we have to throw if there is an error so the task fails
    if (result.err) {
      throw result.err
    }

    return result.val
  },
})
