import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { schema, utils } from "@builderai/db"
import { publishEvents } from "@builderai/tinybird"
import type { PlanConfig, SelectVersion } from "@builderai/validators/price"
import { planConfigSchema, versionBase } from "@builderai/validators/price"
import type { Subscription } from "@builderai/validators/subscription"
import {
  createSubscriptionSchema,
  createUserSchema,
  subscriptionBase,
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
    .mutation(async (opts) => {
      const { planVersion, userId, projectSlug, planId } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const userHasActiveSubscription =
        await opts.ctx.db.query.subscription.findFirst({
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
              operators.eq(fields.userId, userId),
              operators.eq(fields.projectId, project.id),
              operators.eq(fields.status, "active")
            )
          },
        })

      if (userHasActiveSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `User already subscribed to plan: ${userHasActiveSubscription.plan.slug} version: ${userHasActiveSubscription.version.version}`,
        })
      }

      const versionData = await opts.ctx.db.query.version.findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.id, planVersion),
            operators.eq(fields.planId, planId),
            operators.eq(fields.projectId, project.id)
          )
        },
      })

      if (!versionData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Version not found",
        })
      }

      const subscriptionId = utils.newIdEdge("subscription")

      const subscriptionData = await opts.ctx.db
        .insert(schema.subscription)
        .values({
          id: subscriptionId,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
          planVersion: versionData.id,
          planId: versionData.planId,
          userId,
          status: "active",
        })
        .returning()

      return subscriptionData[0]
    }),
  createUser: protectedOrgProcedure
    .input(createUserSchema)
    .mutation(async (opts) => {
      const { projectSlug, email, name } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const userId = utils.newIdEdge("user")

      const userData = await opts.ctx.db
        .insert(schema.user)
        .values({
          id: userId,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
          name,
          email,
        })
        .returning()

      return userData[0]
    }),

  listUsersByProject: protectedOrgProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const users = await opts.ctx.txRLS(({ txRLS }) =>
        txRLS.query.user.findMany({
          where: (user, { eq }) => eq(user.projectId, project.id),
        })
      )

      return {
        users: users,
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
        userId: z.string().optional(),
        featureSlug: z.string(),
      })
    )
    .output(
      z.object({
        subscriptionData: subscriptionBase
          .extend({
            version: versionBase
              .omit({
                featuresPlan: true,
                addonsPlan: true,
              })
              .extend({
                featuresPlan: planConfigSchema,
                addonsPlan: planConfigSchema,
              }),
          })
          .optional(),
        userHasFeature: z.boolean(),
      })
    )
    .query(async (opts) => {
      const { userId, featureSlug } = opts.input
      const apiKey = opts.ctx.apiKey
      const projectId = apiKey.projectId

      // find if there is a plan already saved in redis
      const id = `app:${projectId}:user:${userId}`

      const payload = (await redis.hgetall(id)) as Subscription & {
        version: SelectVersion
      }

      if (payload) {
        console.log("payload", payload)
        const featuresPlan = payload.version.featuresPlan!
        const allFeaturesPlan = Object.keys(featuresPlan)
          .map((group) => featuresPlan[group]?.features)
          .flat()

        const userHasFeature = allFeaturesPlan.some(
          (f) => f?.slug === featureSlug
        )

        // save report usage to analytics
        await publishEvents({
          event_name: "feature_access",
          session_id: userId ?? "unknown",
          id: userId ?? "unknown",
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

      // if userId is not provided, use the authenticated user
      const usrId = userId ?? opts.ctx.auth?.userId

      if (!usrId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "UserId not provided or you are not authenticated",
        })
      }

      const user = await opts.ctx.db.query.user.findFirst({
        columns: {
          id: true,
        },
        where: (user, { eq, and }) =>
          and(eq(user.id, usrId), eq(user.projectId, projectId)),
      })

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      }

      const feature = await opts.ctx.db.query.feature.findFirst({
        columns: {
          slug: true,
        },
        where: (feature, { eq, and }) =>
          and(eq(feature.slug, featureSlug), eq(feature.projectId, projectId)),
      })

      if (!feature) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found",
        })
      }

      const subscription = await opts.ctx.db.query.subscription.findMany({
        with: {
          version: true,
        },
        where: (subscription, { eq, and }) =>
          and(
            eq(subscription.userId, user.id),
            eq(subscription.status, "active"),
            eq(subscription.projectId, projectId)
          ),
      })

      if (!subscription || subscription.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User does not have an active subscription",
        })
      }

      if (subscription.length > 1) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User has more than one active subscription",
        })
      }

      const subscriptionData = subscription[0]
      const versionPlan = subscriptionData?.version

      if (!versionPlan) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Version not found in subscription",
        })
      }

      const featuresPlan = versionPlan.featuresPlan as PlanConfig
      const allFeaturesPlan = Object.keys(featuresPlan)
        .map((group) => featuresPlan[group]?.features)
        .flat()

      const userHasFeature = allFeaturesPlan.some(
        (f) => f?.slug === featureSlug
      )

      // TODO: report usage to analytics
      // TODO: cache this result to avoid querying the database every time

      if (!payload) {
        // if not, save the plan in redis
        await redis.hset(id, subscriptionData)
      }

      // TODO: before returning the result, check if the user has access to the feature in the current plan

      return {
        userHasFeature,
        subscriptionData,
      }
    }),
})
