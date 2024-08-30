import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { subscriptionInsertSchema } from "@unprice/db/validators"
import { addDays, format } from "date-fns"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { createSubscription } from "../../../utils/shared"

export const changePlan = protectedProjectProcedure
  .input(
    subscriptionInsertSchema
      .extend({
        endDateAt: z.coerce.number(),
        nextPlanVersionId: z.string(),
      })
      .required({
        id: true,
        endDateAt: true,
        customerId: true,
        nextPlanVersionId: true,
      })
  )
  .output(z.object({ result: z.boolean(), message: z.string() }))
  .mutation(async (opts) => {
    const {
      id: subscriptionId,
      customerId,
      endDateAt,
      nextPlanVersionId,
      collectionMethod,
      type,
      defaultPaymentMethodId,
      autoRenew,
      trialDays,
      timezone,
      whenToBill,
      startCycle,
    } = opts.input
    const project = opts.ctx.project

    // only owner and admin can change the plan of a subscription
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

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
          eq(subscription.projectId, project.id),
          eq(subscription.customerId, customerId)
        ),
    })

    if (!subscriptionData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found. Please check the id and customerId",
      })
    }

    if (subscriptionData.status === "inactive") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Subscription is already inactive",
      })
    }

    if (subscriptionData.status === "ended") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Subscription is already ended",
      })
    }

    if (subscriptionData.planVersion.id === nextPlanVersionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot change the subscription for the same plan version.",
      })
    }

    // if the customer has trials left we should not let the customer change the subscription until the trial ends
    if (subscriptionData?.trialEndsAt && subscriptionData.trialEndsAt > Date.now()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `The customer has a trial until ${format(
          subscriptionData.trialEndsAt,
          "yyyy-MM-dd"
        )}. Please set the endDate after the trial ends`,
      })
    }

    // if the subscription was changed in the last 30 days, we should not allow the customer to change the plan
    if (
      subscriptionData.planChangedAt &&
      subscriptionData.planChangedAt > addDays(new Date(Date.now()), -30).getTime()
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "You cannot change the plan version, this subscription was changed in the last 30 days.",
      })
    }

    // end date must be after the start date
    if (endDateAt < subscriptionData.startDateAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "End date must be after start date",
      })
    }

    // if there is no planVersionId provided, we downgrade the customer to the default plan
    const newPlanVersion = await opts.ctx.db.query.versions.findFirst({
      where: (version, { eq, and }) =>
        and(
          eq(version.id, nextPlanVersionId),
          eq(version.projectId, project.id),
          eq(version.status, "published"),
          eq(version.currency, subscriptionData.customer.defaultCurrency)
        ),
    })

    if (!newPlanVersion) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "New plan version not found",
      })
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
          status: "ended",
          endDateAt: endDateAt,
          nextPlanVersionId: newPlanVersion.id,
          planChangedAt: Date.now(),
        })
        .where(
          and(
            eq(schema.subscriptions.id, subscriptionId),
            eq(schema.subscriptions.projectId, project.id),
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
          planVersionId: newPlanVersion.id,
          projectId: project.id,
          collectionMethod: collectionMethod ?? subscriptionData.collectionMethod,
          startDateAt: addDays(new Date(endDateAt), 1).getTime(),
          timezone: timezone,
          whenToBill: whenToBill,
          startCycle: startCycle,
          endDateAt: undefined,
          autoRenew: autoRenew ?? subscriptionData.autoRenew,
          isNew: true,
          defaultPaymentMethodId: defaultPaymentMethodId ?? subscriptionData.defaultPaymentMethodId,
          trialDays: trialDays ?? 0,
          type: type ?? subscriptionData.type,
          planChangedAt: Date.now(),
        },
        projectId: project.id,
        ctx: opts.ctx,
      })

      // set the new subscription as the nextSubscriptionId
      await trx
        .update(schema.subscriptions)
        .set({
          nextSubscriptionId: newSubscription.id,
        })
        .where(
          and(
            eq(schema.subscriptions.id, subscriptionId),
            eq(schema.subscriptions.projectId, project.id),
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
