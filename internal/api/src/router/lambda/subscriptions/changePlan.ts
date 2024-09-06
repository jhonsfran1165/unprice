import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { subscriptionChangePlanSchema } from "@unprice/db/validators"
import { addDays } from "date-fns"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { createSubscription } from "../../../utils/shared"

export const changePlan = protectedProjectProcedure
  .input(subscriptionChangePlanSchema)
  .output(z.object({ result: z.boolean(), message: z.string() }))
  .mutation(async (opts) => {
    const {
      id: subscriptionId,
      customerId,
      endDateAt,
      nextPlanVersionId,
      collectionMethod,
      defaultPaymentMethodId,
      autoRenew,
      trialDays,
      timezone,
      whenToBill,
      startCycle,
      config,
      projectId,
    } = opts.input

    const subscriptionData = await opts.ctx.db.query.subscriptions.findFirst({
      with: {
        customer: true,
        planVersion: {
          with: {
            plan: true,
          },
        },
      },
      where: (subscription, { eq, and }) =>
        and(
          eq(subscription.id, subscriptionId),
          eq(subscription.projectId, projectId),
          eq(subscription.customerId, customerId)
        ),
    })

    if (!subscriptionData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found. Please check the id and customerId",
      })
    }

    if (subscriptionData.status === "changed") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Subscription is already changed",
      })
    }

    if (subscriptionData.status === "cancelled") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Subscription is cancelled",
      })
    }

    let newPlanVersionId = nextPlanVersionId

    if (!nextPlanVersionId) {
      // if there is no planVersionId provided, we downgrade the customer to the default plan
      const plans = await opts.ctx.db.query.plans.findFirst({
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

      if (!plans) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error getting plans",
        })
      }

      if (subscriptionData.planVersion.plan.id === plans.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change the subscription for the same plan.",
        })
      }

      const defaultPlanVersion = plans?.versions[0]

      if (!defaultPlanVersion) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error getting default plan version",
        })
      }

      newPlanVersionId = defaultPlanVersion.id
    }

    if (!newPlanVersionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Plan not found",
      })
    }

    if (subscriptionData.planVersion.id === newPlanVersionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You are already subscribed to this plan.",
      })
    }

    // if the subscription was changed in the last 30 days, we should not allow the customer to change the plan
    if (
      subscriptionData.metadata?.lastPlanChangeAt &&
      subscriptionData.metadata.lastPlanChangeAt > addDays(new Date(Date.now()), -30).getTime()
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "You cannot change the plan version, this subscription was changed in the last 30 days.",
      })
    }

    // end date must be after the start date
    if (endDateAt && endDateAt < subscriptionData.startDateAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "End date must be after start date",
      })
    }

    // if the subscription is stil trialing, we need to set the endDateAt to the trialEndsAt
    let endDateAtToUse = endDateAt ?? Date.now()

    if (subscriptionData.status === "trialing") {
      endDateAtToUse = endDateAt ?? subscriptionData.trialEndsAt ?? Date.now()
    }

    // 1. update the subscription to inactive
    // 2. set the planVersionDowngradeTo, endDate and planChanged and nextSubscriptionId
    // 3. create a new subscription with the default plan version
    // 4. set the new subscription as the nextSubscriptionId

    const newSubscription = await opts.ctx.db.transaction(async (trx) => {
      // end the current subscription
      const subscription = await trx
        .update(schema.subscriptions)
        .set({
          status: "changed",
          endDateAt: endDateAtToUse,
          nextPlanVersionId: newPlanVersionId,
          changedAt: Date.now(),
        })
        .where(
          and(
            eq(schema.subscriptions.id, subscriptionId),
            eq(schema.subscriptions.customerId, customerId)
          )
        )
        .returning()
        .then((re) => re[0])

      if (!subscription) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error ending subscription",
        })
      }

      // create a new subscription
      const { subscription: newSubscription } = await createSubscription({
        subscription: {
          customerId: customerId,
          planVersionId: newPlanVersionId,
          projectId: projectId,
          collectionMethod: collectionMethod ?? subscriptionData.collectionMethod,
          // will set the start date right after the end date of the current subscription
          startDateAt: endDateAtToUse + 1,
          timezone: timezone,
          whenToBill: whenToBill,
          startCycle: startCycle,
          config: config,
          endDateAt: undefined,
          autoRenew: autoRenew,
          defaultPaymentMethodId: defaultPaymentMethodId,
          trialDays: trialDays ?? 0,
          changedAt: subscriptionData.changedAt,
          type: subscriptionData.type,
          metadata: {
            lastPlanChangeAt: Date.now(),
          },
        },
        projectId: projectId,
        ctx: {
          ...opts.ctx,
          db: trx,
        },
      })

      // set the old subscription with the next subscription id
      await trx
        .update(schema.subscriptions)
        .set({
          nextSubscriptionId: newSubscription.id,
        })
        .where(
          and(
            eq(schema.subscriptions.id, subscriptionId),
            eq(schema.subscriptions.customerId, customerId)
          )
        )

      return newSubscription
    })

    if (!newSubscription) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error changing plan",
      })
    }

    return {
      result: true,
      message: "Subscription changed successfully",
    }
  })
