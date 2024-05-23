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
          planFeatures: {
            with: {
              feature: true,
            },
          },
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
          message:
            "Plan version is not published, only published versions can be subscribed to",
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

      // check the active subscriptions of the customer.
      // The plan version the customer is attempting to subscript can't have any feature that the customer already has
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

          // TODO: what if I try to validate all of this from the schema?
          if (feature.featureType !== "usage" && quantity === undefined) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Feature ${feature.feature.slug} is not a usage based feature and requires a quantity`,
            })
          }

          if (limit && quantity && quantity > limit) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Feature ${feature.feature.slug} has a limit of ${limit} and the quantity is ${quantity}`,
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

      // every time a subscription is created, we need to update the cache
      waitUntil(
        opts.ctx.db.query.customers
          .findFirst({
            with: {
              subscriptions: {
                columns: {
                  id: true,
                  planVersionId: true,
                  customerId: true,
                  status: true,
                  items: true,
                  metadata: true,
                },
                where: (sub, { eq }) => eq(sub.status, "active"),
                orderBy(fields, operators) {
                  return [operators.desc(fields.startDate)]
                },
                with: {
                  planVersion: {
                    columns: {
                      id: true,
                      planId: true,
                      status: true,
                      planType: true,
                      active: true,
                      currency: true,
                      billingPeriod: true,
                      startCycle: true,
                      gracePeriod: true,
                      whenToBill: true,
                      paymentProvider: true,
                      metadata: true,
                    },
                    with: {
                      plan: {
                        columns: {
                          slug: true,
                        },
                      },
                      planFeatures: {
                        columns: {
                          id: true,
                          featureId: true,
                          featureType: true,
                          planVersionId: true,
                          config: true,
                          metadata: true,
                          limit: true,
                        },
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
              },
            },
            where: (customer, { eq, and }) =>
              and(
                eq(customer.id, customerData.id),
                eq(customer.projectId, customerData.projectId)
              ),
          })
          .then(async (customer) => {
            if (!customer) {
              // TODO: log error
              console.error("Customer not found")
              return
            }

            await opts.ctx.cache.setCustomerActiveSubs(
              customer.id,
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
