import { z } from "zod"

import { SubscriptionMachine } from "#services/subscriptions"
import { publicProcedure } from "#trpc"
import { TRPCError } from "@trpc/server"

export const testing = publicProcedure
  .input(
    z.void()
  )
  .query(async (opts) => {
    const {
      val: subscription,
      err
    } = await SubscriptionMachine.create({
      subscriptionId: "sub_1EhEuYZPSpEskDikKYwJn",
      projectId: "proj_1EM4YA1jwN6rY51TYo5rY",
      analytics: opts.ctx.analytics,
      logger: opts.ctx.logger,
      waitUntil: opts.ctx.waitUntil,
    })

    if (err) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: err.message,
        cause: err,
      })
    }

    const {
      val: result,
      err: errEndTrial,
    } = await subscription.endTrial()

    if (errEndTrial) {
      // Throw a proper TRPC error to be returned to the client
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: errEndTrial.message,
        cause: errEndTrial,
      })
    }

    // If successful, return the result
    return {
      status: result,
      message: "Subscription ended successfully",
    }
  })
