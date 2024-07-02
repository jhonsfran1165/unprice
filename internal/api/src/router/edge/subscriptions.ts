import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import {
  type PlanVersion,
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
      subscriptionInsertSchema
        .extend({
          config: subscriptionItemsConfigSchema.optional(),
        })
        .required({
          id: true,
        })
    )
    .output(z.object({ result: z.boolean(), message: z.string() }))
    .mutation(async (opts) => {
      const {
        id: subscriptionId,
        customerId,
        endDate,
        planVersionId,
        collectionMethod,
        type,
        defaultPaymentMethodId,
      } = opts.input
      const project = opts.ctx.project

      const subscriptionData = await opts.ctx.db.query.subscriptions.findFirst({
        with: {
          customer: true,
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

      if (subscriptionData.planVersionId === planVersionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot end the subscription with the same planVersionId",
        })
      }

      // if the customer has trials left we should not end the subscription until the trial ends
      if (subscriptionData?.trialEnds && subscriptionData.trialEnds > new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `The customer has a trial until ${subscriptionData.trialEnds}. Please set the endDate after the trial ends`,
        })
      }

      // if there is no planVersionId provided, we downgrade the customer to the default plan
      let defaultPlanVersion: PlanVersion

      if (!planVersionId) {
        // find the default plan to downgrade the customer
        // by default we downgrade to the latest published plan version
        const plan = await opts.ctx.db.query.plans
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

        if (!plan) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Default plan version not found or there is no published plan version with the currency of the customer",
          })
        }

        defaultPlanVersion = plan
      } else {
        const version = await opts.ctx.db.query.versions.findFirst({
          where: (version, { eq, and }) =>
            and(
              eq(version.id, planVersionId),
              eq(version.projectId, project.id),
              eq(version.status, "published"),
              eq(version.currency, subscriptionData.customer.defaultCurrency)
            ),
        })

        if (!version) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Provided plan version not found or there is no published plan version with the currency of the customer",
          })
        }

        defaultPlanVersion = version
      }

      // if the endDate is provided, we set the endDate and the nextPlanVersionTo
      // there is a cron job that will downgrade the customer to the default plan version
      const updatedSubscription = await opts.ctx.db
        .update(schema.subscriptions)
        .set({
          endDate: endDate,
          nextPlanVersionTo: defaultPlanVersion.id,
          planChanged: new Date(),
          status: "ended",
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

      if (!updatedSubscription) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error ending subscription",
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
              planVersionId: defaultPlanVersion.id,
              projectId: project.id,
              collectionMethod: collectionMethod ?? subscriptionData.collectionMethod,
              startDate: new Date(),
              autoRenew: subscriptionData.autoRenew,
              isNew: true,
              defaultPaymentMethodId:
                defaultPaymentMethodId ?? subscriptionData.defaultPaymentMethodId,
              trialDays: 0,
              type: type ?? subscriptionData.type,
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
            message: "Error ending subscription",
          })
        }

        return {
          result: true,
          message: "Subscription ended successfully",
        }
      }

      return {
        result: true,
        message: "Subscription will end on the provided endDate",
      }
    }),
})
