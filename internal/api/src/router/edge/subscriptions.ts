import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import {
  subscriptionInsertSchema,
  subscriptionItemsConfigSchema,
  subscriptionSelectSchema,
} from "@builderai/db/validators"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import {
  createTRPCRouter,
  protectedActiveProjectAdminProcedure,
  protectedActiveProjectProcedure,
} from "../../trpc"
import { createSubscription } from "../../utils/shared"

export const subscriptionRouter = createTRPCRouter({
  create: protectedActiveProjectAdminProcedure
    .input(
      subscriptionInsertSchema.extend({
        config: subscriptionItemsConfigSchema.optional(),
      })
    )
    .output(
      z.object({
        subscription: subscriptionSelectSchema,
      })
    )
    .mutation(async (opts) => {
      const { subscription } = await createSubscription({
        subscription: opts.input,
        project: opts.ctx.project,
        ctx: opts.ctx,
      })

      return {
        subscription: subscription,
      }
    }),

  listByPlanVersion: protectedActiveProjectProcedure
    .input(
      subscriptionSelectSchema.pick({
        planVersionId: true,
      })
    )
    .output(
      z.object({
        subscriptions: z.array(subscriptionSelectSchema),
      })
    )
    .query(async (opts) => {
      const { planVersionId } = opts.input
      const project = opts.ctx.project

      const subscriptionData = await opts.ctx.db.query.subscriptions.findMany({
        where: (subscription, { eq, and }) =>
          and(
            eq(subscription.projectId, project.id),
            eq(subscription.planVersionId, planVersionId)
          ),
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
    }),
  end: protectedActiveProjectAdminProcedure
    .input(
      subscriptionSelectSchema.pick({
        id: true,
        customerId: true,
        endDate: true,
      })
    )
    .output(z.object({ result: z.boolean(), message: z.string() }))
    .mutation(async (opts) => {
      const { id, customerId, endDate } = opts.input
      const project = opts.ctx.project

      const subscriptionData = await opts.ctx.db.query.subscriptions.findFirst({
        with: {
          customer: true,
        },
        where: (subscription, { eq, and }) =>
          and(
            eq(subscription.id, id),
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

      // find the default plan to downgrade the customer
      // by default we downgrade to the latest published plan version
      const defaultPlanVersion = await opts.ctx.db.query.plans
        .findFirst({
          with: {
            versions: {
              where: (version, { eq, and }) =>
                and(
                  eq(version.projectId, project.id),
                  eq(version.status, "published"),
                  eq(version.currency, subscriptionData.customer.defaultCurrency)
                ),
              orderBy: (version, { desc }) => [desc(version.publishedAt)],
            },
          },
          where: (plan, { eq, and }) =>
            and(eq(plan.projectId, project.id), eq(plan.defaultPlan, true)),
        })
        .then((re) => re?.versions[0] ?? null)

      if (!defaultPlanVersion) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Default plan version not found",
        })
      }

      // TODO: we should have a way to execute a trigger to downgrade the customer
      // If the endDate is not provided, we downgrade the customer to the default plan immediately
      if (!endDate) {
        // 1. update the subscription to inactive
        // 2. set the planVersionDowngradeTo, endDate and planChanged and nextSubscriptionId
        // 3. create a new subscription with the default plan version
        // 4. set the new subscription as the nextSubscriptionId

        const newSubscription = await opts.ctx.db.transaction(async (trx) => {
          // end the current subscription
          const subscription = await trx
            .update(schema.subscriptions)
            .set({
              status: "inactive",
              endDate: new Date(),
              nextPlanVersionTo: defaultPlanVersion.id,
              planChanged: new Date(),
            })
            .where(
              and(
                eq(schema.subscriptions.id, id),
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
              planVersionId: defaultPlanVersion.id,
              projectId: project.id,
              collectionMethod: subscriptionData.collectionMethod,
              startDate: new Date(),
              autoRenew: subscriptionData.autoRenew,
              isNew: true,
              defaultPaymentMethodId: subscriptionData.defaultPaymentMethodId,
              trialDays: 0,
              type: "plan",
            },
            project: opts.ctx.project,
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
                eq(schema.subscriptions.id, id),
                eq(schema.subscriptions.projectId, project.id),
                eq(schema.subscriptions.customerId, customerId)
              )
            )

          return newSubscription
        })

        if (!newSubscription) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error ending subscription",
          })
        }

        return {
          result: true,
          message: "Subscription ended successfully",
        }
      }

      // if the endDate is provided, we set the endDate and the nextPlanVersionTo
      // there is a cron job that will downgrade the customer to the default plan version
      const updatedSubscription = await opts.ctx.db
        .update(schema.subscriptions)
        .set({
          endDate: endDate,
          nextPlanVersionTo: defaultPlanVersion.id,
          planChanged: new Date(),
        })
        .where(
          and(
            eq(schema.subscriptions.id, id),
            eq(schema.subscriptions.projectId, project.id),
            eq(schema.subscriptions.customerId, customerId)
          )
        )
        .returning()
        .then((re) => re[0])

      if (!updatedSubscription) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error ending subscription",
        })
      }

      return {
        result: true,
        message: "Subscription will end on the provided endDate",
      }
    }),
})
