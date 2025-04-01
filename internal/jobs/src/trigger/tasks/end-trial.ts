import { task } from "@trigger.dev/sdk/v3"
import { SubscriptionService } from "@unprice/services/subscriptions"
import { createContext } from "./context"

export const endTrialTask = task({
  id: "subscription.endtrial",
  retry: {
    maxAttempts: 3,
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
        now: now.toString(),
      },
    })

    const subscriptionService = new SubscriptionService(context)

    const endTrialResult = await subscriptionService.endTrial({
      subscriptionId,
      projectId,
      now,
    })

    if (endTrialResult.err) {
      throw endTrialResult.err
    }

    return {
      status: endTrialResult.val.status,
      subscriptionId,
      projectId,
      now,
      phaseId,
    }
  },
})
