import { TRPCError } from "@trpc/server"
import { waitUntil } from "@vercel/functions"
import { z } from "zod"

import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import type { SubscriptionItem } from "@builderai/db/validators"
import {
  subscriptionInsertSchema,
  subscriptionItemsSchema,
  subscriptionSelectSchema,
} from "@builderai/db/validators"

import { getCustomerHash, UnpriceCache } from "../../pkg/cache"
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
        with: {
          subscriptions: {
            with: {
              planVersion: {
                with: {
                  planFeatures: true,
                },
              },
            },
            where: (sub, { eq }) => eq(sub.status, "active"),
          },
        },
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

      // check the active subscriptions of the customer. The plan version the customer is attempting to subscript can't any feature that the customer already has
      const activeSubscriptions = customerData.subscriptions
      const activeFeatures = activeSubscriptions.flatMap((sub) =>
        sub.planVersion.planFeatures.map((f) => f.id)
      )
      const newFeatures = versionData.planFeatures.map((f) => f.id)
      const commonFeatures = activeFeatures.filter((f) =>
        newFeatures.includes(f)
      )

      if (commonFeatures.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "The customer is trying to subscribe to a feature already active in another subscription",
        })
      }

      // if no items are passed, configuration is created from the default quantities of the plan features
      const configItemsSubscription = versionData.planFeatures.map(
        (feature) => {
          const quantity =
            feature.defaultQuantity ??
            items?.find((i) => i.itemId === feature.id)?.quantity

          const limit = feature.limit

          if (feature.featureType !== "usage" && quantity === undefined) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Feature quantity not provided",
            })
          }

          if (limit && quantity && quantity > limit) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Feature quantity exceeds the limit",
            })
          }

          return {
            itemType: "feature",
            itemId: feature.id,
            limit: limit ?? quantity, // if not provided means there is no limit
            quantity: quantity, // if not provided means is a usage based feature
          } as SubscriptionItem
        }
      )

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
          items: configItemsSubscription,
          metadata: null,
        })
        .returning()
        .then((re) => re[0])

      if (!subscriptionData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating subscription",
        })
      }

      const redisId = getCustomerHash(project.id, customerId)
      const cache = new UnpriceCache()

      // every time a subscription is created, we need to update the cache
      waitUntil(
        opts.ctx.db.query.customers
          .findFirst({
            with: {
              subscriptions: {
                where: (sub, { eq }) => eq(sub.status, "active"),
                with: {
                  planVersion: {
                    with: {
                      planFeatures: {
                        with: {
                          feature: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            where: (customer, { eq, and }) =>
              and(
                eq(customer.id, customerId),
                eq(customer.projectId, project.id)
              ),
          })
          .then(async (customer) => {
            await cache.setCustomerActiveSubs(
              redisId,
              customer?.subscriptions ?? []
            )
          })
      )

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
