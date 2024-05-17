import { TRPCError } from "@trpc/server"
import { z } from "zod"

import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import type { SubscriptionItem } from "@builderai/db/validators"
import {
  subscriptionInsertSchema,
  subscriptionItemsSchema,
  subscriptionSelectSchema,
} from "@builderai/db/validators"

import {
  createTRPCRouter,
  protectedActiveProjectAdminProcedure,
  protectedActiveProjectProcedure,
} from "../../trpc"

export const subscriptionRouter = createTRPCRouter({
  create: protectedActiveProjectAdminProcedure
    .input(
      subscriptionInsertSchema.extend({
        items: subscriptionItemsSchema.optional(),
      })
    )
    .output(
      z.object({
        subscription: subscriptionSelectSchema,
      })
    )
    .mutation(async (opts) => {
      const { planVersionId, customerId, items } = opts.input
      const project = opts.ctx.project

      const versionData = await opts.ctx.db.query.versions.findFirst({
        with: {
          planFeatures: true,
        },
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.id, planVersionId),
            operators.eq(fields.projectId, project.id)
          )
        },
      })

      if (!versionData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Version not found. Please check the planVersionId and the project",
        })
      }

      if (versionData.status !== "published") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Plan version is not published",
        })
      }

      if (!versionData.planFeatures || versionData.planFeatures.length === 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Plan version has no features",
        })
      }

      const customerData = await opts.ctx.db.query.customers.findFirst({
        where: (customer, operators) =>
          operators.and(
            operators.eq(customer.id, customerId),
            operators.eq(customer.projectId, project.id)
          ),
      })

      if (!customerData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found. Please check the customerId",
        })
      }

      // null means the customer is subscribing to the whole plan
      let configItemsSubscription: SubscriptionItem[] = []

      // if items are passed, check if they are valid an set the right quantities
      if (items && items.length > 0) {
        const planFeatures = versionData.planFeatures
        const planFeaturesMap = new Map(planFeatures.map((i) => [i.id, i]))

        configItemsSubscription = items.map((item) => {
          const feature = planFeaturesMap.get(item.itemId)

          if (!feature) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Feature not found in plan version",
            })
          }

          return {
            itemType: "feature",
            itemId: feature.id,
            quantity: item.quantity,
          } as SubscriptionItem
        })
      }

      const subscriptionId = utils.newId("subscription")

      const subscriptionData = await opts.ctx.db
        .insert(schema.subscriptions)
        .values({
          id: subscriptionId,
          projectId: project.id,
          planVersionId: versionData.id,
          customerId: customerData.id,
          startDate: new Date(),
          autoRenew: true,
          isNew: true,
          collectionMethod: "charge_automatically",
          status: "active",
          ...(configItemsSubscription.length > 0 && {
            items: configItemsSubscription,
          }),
          metadata: null,
        })
        .returning()
        .then((re) => re[0])

      console.log(subscriptionData)

      if (!subscriptionData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating subscription",
        })
      }

      return {
        subscription: subscriptionData,
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
})
