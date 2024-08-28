import { TRPCError } from "@trpc/server"
import { subscriptionInsertSchema, subscriptionSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { rateLimiterProcedure } from "../../../trpc"
import { createSubscription } from "../../../utils/shared"

export const signUp = rateLimiterProcedure
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

    const { subscription } = await createSubscription({
      subscription: opts.input,
      projectId: opts.input.projectId,
      ctx: opts.ctx,
    })

    return {
      subscription: subscription,
    }
  })
