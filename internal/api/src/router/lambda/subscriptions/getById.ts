import { TRPCError } from "@trpc/server"
import { subscriptionPhaseExtendedSchema, subscriptionSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProcedure } from "../../../trpc"

export const getById = protectedProcedure
  .input(subscriptionSelectSchema.pick({ id: true }))
  .output(
    z.object({
      subscription: subscriptionSelectSchema.extend({
        phases: subscriptionPhaseExtendedSchema.array(),
      }),
    })
  )
  .query(async (opts) => {
    const { id } = opts.input

    const subscriptionData = await opts.ctx.db.query.subscriptions.findFirst({
      where: (subscription, { eq }) => eq(subscription.id, id),
      with: {
        phases: {
          with: {
            planVersion: true,
            items: {
              with: {
                featurePlanVersion: {
                  with: {
                    feature: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!subscriptionData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found",
      })
    }

    return {
      subscription: subscriptionData,
    }
  })
