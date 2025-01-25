import { task } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { ConsoleLogger } from "@unprice/logging"
import { NoopMetrics } from "@unprice/services/metrics"
import { SubscriptionService } from "@unprice/services/subscriptions"
import { Analytics } from "@unprice/tinybird"
import { env } from "../../env.mjs"

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
    const tinybird = new Analytics({
      emit: true,
      tinybirdToken: env.TINYBIRD_TOKEN,
      tinybirdUrl: env.TINYBIRD_URL,
    })

    const attemptId = ctx.attempt.id
    const taskId = ctx.task.id

    const logger = new ConsoleLogger({
      requestId: attemptId,
      defaultFields: {
        subscriptionId,
        projectId,
        now,
        api: "jobs.subscription.endtrial",
        phaseId,
        taskId,
      },
    })

    const subscriptionService = new SubscriptionService({
      db: db,
      // all calls made to the database
      cache: undefined,
      metrics: new NoopMetrics(),
      logger: logger,
      waitUntil: () => {},
      analytics: tinybird,
    })

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
