import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { schema, utils } from "@builderai/db"
import { publishEvents } from "@builderai/tinybird"
import {
  customerInsertSchema,
  customerSelectSchema,
} from "@builderai/validators/customer"
import type { PlanVersion } from "@builderai/validators/price"
import { versionSelectBaseSchema } from "@builderai/validators/price"
import type { Subscription } from "@builderai/validators/subscription"
import {
  createSubscriptionSchema,
  subscriptionSelectSchema,
} from "@builderai/validators/subscription"

import {
  createTRPCRouter,
  protectedApiProcedure,
  protectedOrgProcedure,
} from "../../trpc"
import { hasAccessToProject, redis } from "../../utils"

export const subscriptionRouter = createTRPCRouter({
  create: protectedOrgProcedure
    .input(createSubscriptionSchema)
    .output(subscriptionSelectSchema.optional())
    .mutation(async (opts) => {
      const { planVersionId, customerId, projectSlug, planId } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const userHasActiveSubscription =
        await opts.ctx.db.query.subscriptions.findFirst({
          columns: {
            id: true,
          },
          with: {
            plan: {
              columns: {
                slug: true,
              },
            },
            version: {
              columns: {
                version: true,
              },
            },
          },
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.customerId, customerId),
              operators.eq(fields.projectId, project.id),
              operators.eq(fields.status, "active")
            )
          },
        })

      if (userHasActiveSubscription?.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `User already subscribed to plan: ${userHasActiveSubscription.plan.slug} version: ${userHasActiveSubscription.version.version}`,
        })
      }

      const versionData = await opts.ctx.db.query.versions.findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.id, planVersionId),
            operators.eq(fields.planId, planId),
            operators.eq(fields.projectId, project.id)
          )
        },
      })

      if (!versionData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Version not found, please check the planId and planVersionId",
        })
      }

      const subscriptionId = utils.newIdEdge("subscription")

      const subscriptionData = await opts.ctx.db
        .insert(schema.subscriptions)
        .values({
          id: subscriptionId,
          projectId: project.id,
          planVersionId: versionData.id,
          planId: versionData.planId,
          customerId,
          status: "active",
        })
        .returning()

      return subscriptionData?.[0]
    }),
  createCustomer: protectedOrgProcedure
    .input(customerInsertSchema)
    .output(customerSelectSchema.optional())
    .mutation(async (opts) => {
      const { projectSlug, email, name } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const customerData = await opts.ctx.db.query.customers.findFirst({
        where: (customer, operators) =>
          operators.and(
            operators.eq(customer.email, email),
            operators.eq(customer.projectId, project.id)
          ),
      })

      if (customerData?.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Customer already exists in this project",
        })
      }

      const customerId = utils.newIdEdge("customer")

      const newCustomerData = await opts.ctx.db
        .insert(schema.customers)
        .values({
          id: customerId,
          projectId: project.id,
          name,
          email,
        })
        .returning()

      return newCustomerData?.[0]
    }),

  listCustomersByProject: protectedOrgProcedure
    .input(z.object({ projectSlug: z.string() }))
    .output(z.object({ customers: z.array(customerSelectSchema) }))
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const customers = await opts.ctx.db.query.customers.findMany({
        where: (customer, { eq }) => eq(customer.projectId, project.id),
      })

      return {
        customers: customers,
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
        subscriptionData: subscriptionSelectSchema
          .extend({
            version: versionSelectBaseSchema,
          })
          .optional(),
        userHasFeature: z.boolean(),
      })
    )
    .query(async (opts) => {
      const { customerId, featureSlug } = opts.input
      const apiKey = opts.ctx.apiKey
      const projectId = apiKey.projectId

      // find if there is a plan already saved in redis
      const id = `app:${projectId}:user:${customerId}`

      const payload = (await redis.hgetall<
        Subscription & { version: PlanVersion }
      >(id))!

      if (payload) {
        console.log("payload", payload)
        const featuresPlan = payload.version.featuresConfig || {}
        const allFeaturesPlan = Object.keys(featuresPlan)
          .map((group) => featuresPlan[group]?.features)
          .flat()

        const userHasFeature = allFeaturesPlan.some(
          (f) => f?.slug === featureSlug
        )

        // TODO: save report usage to analytics - use tinybird from analitycs package
        await publishEvents({
          event_name: "feature_access",
          session_id: customerId ?? "unknown",
          id: customerId ?? "unknown",
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
      }

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
          and(eq(feature.slug, featureSlug), eq(feature.projectId, projectId)),
      })

      if (!feature?.slug) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found, please check the featureSlug",
        })
      }

      const subscription = await opts.ctx.db.query.subscriptions.findMany({
        with: {
          version: true,
        },
        where: (subscription, { eq, and }) =>
          and(
            eq(subscription.customerId, customer.id),
            eq(subscription.status, "active"),
            eq(subscription.projectId, projectId)
          ),
      })

      if (!subscription || subscription.length === 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User does not have an active subscription",
        })
      }

      if (subscription.length > 1) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User has more than one active subscription",
        })
      }

      const subscriptionData = subscription[0]
      const versionPlan = subscriptionData?.version

      if (!versionPlan?.addonsConfig) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Version not found in subscription or it has no features",
        })
      }

      const featuresPlan = versionPlan.addonsConfig
      const allFeaturesPlan = Object.keys(featuresPlan)
        .map((group) => featuresPlan[group]?.features)
        .flat()

      const userHasFeature = allFeaturesPlan.some(
        (f) => f?.slug === featureSlug
      )

      if (!payload) {
        // if not, save the plan in redis
        await redis.hset(id, subscriptionData ?? {})
      }

      // TODO: save report usage to analytics - use tinybird from analitycs package
      await publishEvents({
        event_name: "feature_access",
        session_id: customerId ?? "unknown",
        id: customerId ?? "unknown",
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
        subscriptionData,
      }
    }),
})
