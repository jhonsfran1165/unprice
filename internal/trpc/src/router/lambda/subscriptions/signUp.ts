import { subscriptionInsertSchema, subscriptionSelectSchema } from "@unprice/db/validators"
import { SubscriptionService } from "@unprice/services/subscriptions"
import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { publicProcedure } from "#trpc"

export const signUp = publicProcedure
  .input(
    subscriptionInsertSchema.required({
      projectId: true,
    })
  )
  .output(
    z.object({
      subscription: subscriptionSelectSchema,
    })
  )
  .mutation(async (opts) => {
    const project = await opts.ctx.db.query.projects.findFirst({
      where: (project, { eq }) => eq(project.id, opts.input.projectId),
    })

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      })
    }

    const subscriptionService = new SubscriptionService(opts.ctx)

    const { err, val } = await subscriptionService.createSubscription({
      input: opts.input,
      projectId: project.id,
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      })
    }

    return {
      subscription: val,
    }
  })
