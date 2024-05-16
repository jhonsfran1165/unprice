import { TRPCError } from "@trpc/server"
import { z } from "zod"

import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import type {
  SubscriptionExtended,
  SubscriptionItem,
} from "@builderai/db/validators"
import {
  subscriptionInsertSchema,
  subscriptionItemsSchema,
  subscriptionSelectSchema,
} from "@builderai/db/validators"
import { publishEvents } from "@builderai/tinybird"

import {
  createTRPCRouter,
  protectedActiveProjectAdminProcedure,
  protectedActiveProjectProcedure,
  protectedApiProcedure,
} from "../../trpc"
import { redis } from "../../utils"

export const subscriptionRouter = createTRPCRouter({
  create: protectedActiveProjectAdminProcedure
    .input(
      subscriptionInsertSchema.extend({
        items: subscriptionItemsSchema.optional(),
      })
    )
    .output(
      z.object({
        subscription: subscriptionSelectSchema.optional(),
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
        })
        .returning()
        .then((re) => re[0])

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

  can: protectedApiProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/edge/subscription.can",
        protect: true,
      },
    })
    .input(
      z.object({
        customerId: z.string(),
        featureSlug: z.string(),
      })
    )
    .output(
      z.object({
        userHasFeature: z.boolean(),
      })
    )
    .query(async (opts) => {
      const { customerId, featureSlug } = opts.input
      const apiKey = opts.ctx.apiKey
      const projectId = apiKey.projectId

      // find if there is a plan already saved in redis
      const id = `app:${projectId}:user:${customerId}`

      const payload = (await redis.hgetall<{
        subscriptions: SubscriptionExtended[]
      }>(id))!

      if (payload) {
        // check if the user has access to the feature in one of the active subscriptions
        const userHasFeature = payload.subscriptions.some((sub) => {
          return sub.planVersion.planVersionFeatures.some(
            (pv) => pv.feature.slug === featureSlug
          )
        })

        // TODO: add wait until here

        // TODO: save report usage to analytics - use tinybird from analitycs package
        await publishEvents({
          event_name: "feature_access",
          session_id: customerId,
          id: customerId,
          domain: "subscription",
          subdomain: "can",
          time: Date.now(),
          timestamp: new Date().toISOString(),
          payload: {
            featureSlug,
            userHasFeature,
            subscriptionData: payload,
          },
        })

        return {
          userHasFeature,
          subscriptionData: payload,
        }
      } else {
        const customer = await opts.ctx.db.query.customers.findFirst({
          columns: {
            id: true,
          },
          where: (customer, { eq, and }) =>
            and(eq(customer.id, customerId), eq(customer.projectId, projectId)),
        })

        if (!customer?.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer not found, please check the customerId",
          })
        }

        const feature = await opts.ctx.db.query.features.findFirst({
          columns: {
            slug: true,
          },
          where: (feature, { eq, and }) =>
            and(
              eq(feature.slug, featureSlug),
              eq(feature.projectId, projectId)
            ),
        })

        if (!feature?.slug) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feature not found, please check the featureSlug",
          })
        }

        const subscriptionsData =
          await opts.ctx.db.query.subscriptions.findMany({
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
            where: (subscription, { eq, and }) =>
              and(
                eq(subscription.customerId, customer.id),
                eq(subscription.projectId, projectId),
                eq(subscription.status, "active")
              ),
          })

        if (!subscriptionsData || subscriptionsData.length === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User does not have an active subscription",
          })
        }
        // check if the user has access to the feature in one of the active subscriptions
        const userHasFeature = subscriptionsData.some((sub) => {
          return sub.planVersion.planFeatures.some(
            (pv) => pv.feature.slug === featureSlug
          )
        })

        // save to redis
        await redis.hset(id, { subscriptions: subscriptionsData })

        // TODO: save report usage to analytics - use tinybird from analitycs package
        await publishEvents({
          event_name: "feature_access",
          session_id: customerId,
          id: customerId,
          domain: "subscription",
          subdomain: "can",
          time: Date.now(),
          timestamp: new Date().toISOString(),
          payload: {
            featureSlug,
            userHasFeature,
            subscriptionData: payload,
          },
        })

        return {
          userHasFeature,
        }
      }
    }),
})
