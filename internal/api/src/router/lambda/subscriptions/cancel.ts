import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { subscriptionSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProcedure } from "../../../trpc"

export const cancel = protectedProcedure
  .input(subscriptionSelectSchema.pick({ id: true, projectId: true }))
  .output(z.object({ result: z.boolean(), message: z.string() }))
  .mutation(async (opts) => {
    const { id, projectId } = opts.input

    // end the current subscription
    const subscription = await opts.ctx.db
      .update(schema.subscriptions)
      .set({
        status: "ended",
        endDateAt: Date.now(),
        nextPlanVersionTo: undefined,
        planChangedAt: Date.now(),
      })
      .where(and(eq(schema.subscriptions.id, id), eq(schema.subscriptions.projectId, projectId)))
      .returning()
      .then((re) => re[0])

    if (!subscription) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error ending subscription",
      })
    }

    return {
      result: true,
      message: "Subscription canceled successfully",
    }
  })
