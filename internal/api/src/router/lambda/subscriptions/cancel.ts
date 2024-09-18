import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { subscriptionSelectSchema } from "@unprice/db/validators"
import { getMonth, getYear } from "date-fns"
import { z } from "zod"
import { protectedProcedure } from "../../../trpc"

export const cancel = protectedProcedure
  .input(subscriptionSelectSchema.pick({ id: true, projectId: true }))
  .output(z.object({ result: z.boolean(), message: z.string() }))
  .mutation(async (opts) => {
    const { id, projectId } = opts.input

    const subscriptionData = await opts.ctx.db.query.subscriptions.findFirst({
      where(fields, operators) {
        return operators.and(eq(fields.id, id), eq(fields.projectId, projectId))
      },
      with: {
        planVersion: {
          with: {
            plan: true,
          },
        },
        items: {
          with: {
            featurePlanVersion: {
              with: {
                feature: {
                  columns: {
                    slug: true,
                    id: true,
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

    if (subscriptionData.status === "canceled") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Subscription is already cancelled",
      })
    }

    // all this should be in a transaction
    await opts.ctx.db.transaction(async (tx) => {
      const plans = await tx.query.plans.findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.projectId, projectId),
            operators.eq(fields.active, true),
            operators.eq(fields.defaultPlan, true)
          )
        },
        with: {
          versions: {
            where(fields, operators) {
              return operators.and(
                operators.eq(fields.active, true),
                operators.eq(fields.status, "published"),
                operators.eq(fields.latest, true)
              )
            },
          },
        },
      })

      const defaultPlanVersion = plans?.versions[0]

      if (!defaultPlanVersion) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error getting default plan version",
        })
      }

      // customers cannot cancel the default plan
      if (subscriptionData.planVersion.plan.id === plans.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot cancel the default plan",
        })
      }

      // if the subscription is stil trialing, we need to set the endAt to the trialEndsAt
      let endAt = subscriptionData.endAt ?? Date.now()

      if (subscriptionData.status === "trialing") {
        // if the subscription is stil trialing, we need to set the endAt to the trialEndsAt
        endAt = subscriptionData.trialEndsAt ?? Date.now()
      }

      // cancelled the current subscription
      const subscriptionUpdated = await tx
        .update(schema.subscriptions)
        .set({
          status: "canceled",
          endAt: endAt,
        })
        .where(and(eq(schema.subscriptions.id, id), eq(schema.subscriptions.projectId, projectId)))
        .returning()
        .then((re) => re[0])

      if (!subscriptionUpdated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error ending subscription",
        })
      }

      const currentMonth = getMonth(Date.now()) + 1
      const currentYear = getYear(Date.now())

      // reseting the cache for the customer so the next call to get entitlements will get the new subscription
      // if endDate is in the future we dont need to reset the cache just yet
      if (endAt <= Date.now()) {
        opts.ctx.waitUntil(
          Promise.all([
            // reset the cache
            opts.ctx.cache.subscriptionsByCustomerId.remove(subscriptionData.customerId),
            opts.ctx.cache.entitlementsByCustomerId.remove(subscriptionData.customerId),
            // reset features
            subscriptionData.items.map((item) => {
              opts.ctx.cache.featureByCustomerId.remove(
                `${subscriptionData.customerId}:${item.featurePlanVersion.feature.slug}:${currentYear}:${currentMonth}`
              )
            }),
          ])
        )
      }
    })

    return {
      result: true,
      message: "Subscription canceled successfully",
    }
  })
