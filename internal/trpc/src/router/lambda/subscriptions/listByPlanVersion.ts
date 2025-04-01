import { TRPCError } from "@trpc/server"
import { subscriptionSelectSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"

export const listByPlanVersion = protectedProjectProcedure
  .input(z.object({ planVersionId: z.string() }))
  .output(
    z.object({
      subscriptions: z.array(subscriptionSelectSchema),
    })
  )
  .query(async (opts) => {
    const { planVersionId } = opts.input
    const project = opts.ctx.project

    const subscriptionData = await opts.ctx.db.query.subscriptions.findMany({
      with: {
        phases: {
          where: (phase, { eq }) => eq(phase.planVersionId, planVersionId),
        },
      },
      where: (subscription, { eq }) => eq(subscription.projectId, project.id),
    })

    if (!subscriptionData || subscriptionData.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found. Please check the planVersionId",
      })
    }

    return {
      subscriptions: subscriptionData,
    }
  })
