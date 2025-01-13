import { task } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"
import { ConsoleLogger } from "@unprice/logging"
import { SubscriptionService } from "@unprice/services/subscriptions"

import { NoopMetrics } from "@unprice/services/metrics"
import { Analytics } from "@unprice/tinybird"
import { env } from "../../env.mjs"

export const invoiceTask = task({
  id: "subscription.phase.invoice",
  retry: {
    maxAttempts: 1,
  },
  run: async (
    {
      subscriptionId,
      projectId,
      now,
    }: {
      subscriptionId: string
      projectId: string
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
        subscriptionId,
        projectId,
        now,
        api: "jobs.subscription.phase.invoice",
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

    // skip if the phase is trailing
    const activePhaseMachine = await subscriptionService.getActivePhaseMachine({ now })

    if (activePhaseMachine.err) {
      throw activePhaseMachine.err
    }

    const activePhase = activePhaseMachine.val.getPhase()

    if (activePhase.status === "trialing") {
      return {
        status: "skipped",
        message: "Subscription is in trial phase",
      }
    }

    const result = await subscriptionService.invoiceSubscription({
      now,
    })

    // we have to throw if there is an error so the task fails
    if (result.err) {
      throw result.err
    }

    return result.val
  },
})
