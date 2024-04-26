import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import type { PlanVersion, Subscription } from "@builderai/db/validators"
import {
  createSubscriptionSchema,
  customerInsertSchema,
  customerSelectSchema,
  searchDataParamsSchema,
  subscriptionSelectSchema,
  subscriptionWithCustomerSchema,
  versionSelectBaseSchema,
} from "@builderai/db/validators"
import { publishEvents } from "@builderai/tinybird"

import {
  createTRPCRouter,
  protectedActiveProjectAdminProcedure,
  protectedActiveProjectProcedure,
  protectedActiveWorkspaceProcedure,
  protectedApiProcedure,
} from "../../trpc"
import { projectGuard, redis } from "../../utils"

export const subscriptionRouter = createTRPCRouter({
  create: protectedActiveWorkspaceProcedure
    .input(createSubscriptionSchema)
    .output(subscriptionSelectSchema.optional())
    .mutation(async (opts) => {
      const { planVersionId, customerId, projectSlug, planId } = opts.input

      const { project } = await projectGuard({
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

      const subscriptionId = utils.newId("subscription")

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
  createCustomer: protectedActiveProjectAdminProcedure
    .input(customerInsertSchema)
    .output(
      z.object({
        customer: customerSelectSchema,
      })
    )
    .mutation(async (opts) => {
      const { email, name } = opts.input
      const project = opts.ctx.project

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

      const customerId = utils.newId("customer")

      const newCustomerData = await opts.ctx.db
        .insert(schema.customers)
        .values({
          id: customerId,
          projectId: project.id,
          name,
          email,
        })
        .returning()

      if (!newCustomerData?.[0]) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating customer",
        })
      }

      return {
        customer: newCustomerData[0],
      }
    }),

  deleteCustomer: protectedActiveProjectAdminProcedure
    .input(customerSelectSchema.pick({ id: true }))

    .output(
      z.object({
        customer: customerSelectSchema,
      })
    )
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const deletedCustomer = await opts.ctx.db
        .delete(schema.customers)
        .where(
          and(
            eq(schema.customers.projectId, project.id),
            eq(schema.customers.id, id)
          )
        )
        .returning()

      if (!deletedCustomer?.[0]) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting customer",
        })
      }

      return {
        customer: deletedCustomer[0],
      }
    }),
  // TODO: add pagination and filtering - abstract to a common function input schema
  listCustomersByProject: protectedActiveWorkspaceProcedure
    .input(
      searchDataParamsSchema.extend({
        projectSlug: z.string(),
      })
    )
    .output(z.object({ customers: z.array(customerSelectSchema) }))
    .query(async (opts) => {
      const { projectSlug, fromDate, toDate } = opts.input

      const { project } = await projectGuard({
        projectSlug,
        ctx: opts.ctx,
      })

      // TODO: pass subscription data so I can validate if the user is subscribed to a plan
      // const columns = getTableColumns(schema.customers)
      // // need customer with subscription
      // const customersSubscriptions = await opts.ctx.db.select({
      //   ...columns,
      //   subscriptions: {
      //     id: schema.subscriptions.id,
      //   },
      // }).from(schema.customers).innerJoin(schema.subscriptions, eq(schema.customers.id, schema.subscriptions.customerId)).
      // where(
      //   and(
      //     eq(schema.customers.projectId, project.id),
      //     fromDate && toDate
      //       ? between(
      //           schema.customers.createdAt,
      //           new Date(fromDate),
      //           new Date(toDate)
      //         )
      //       : undefined,
      //     fromDate ? gte(schema.customers.createdAt, new Date(fromDate)) : undefined,
      //     toDate ? lte(schema.customers.createdAt, new Date(toDate)) : undefined
      //   )
      // )

      const customers = await opts.ctx.db.query.customers.findMany({
        where: (customer, { eq, and, between, gte, lte }) =>
          and(
            eq(customer.projectId, project.id),
            fromDate && toDate
              ? between(
                  customer.createdAt,
                  new Date(fromDate),
                  new Date(toDate)
                )
              : undefined,
            fromDate ? gte(customer.createdAt, new Date(fromDate)) : undefined,
            toDate ? lte(customer.createdAt, new Date(toDate)) : undefined
          ),
      })

      return {
        customers: customers,
      }
    }),

  listByPlan: protectedActiveProjectProcedure
    .input(
      z.object({
        planSlug: z.string(),
        planVersionId: z.number(),
      })
    )
    .output(
      z.object({
        subscriptions: z.array(subscriptionWithCustomerSchema),
      })
    )
    .query(async (opts) => {
      const { planVersionId, planSlug } = opts.input
      const project = opts.ctx.project

      const plan = await opts.ctx.db.query.plans.findFirst({
        where: (plan, { eq, and }) =>
          and(eq(plan.projectId, project.id), eq(plan.slug, planSlug)),
      })

      if (!plan?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found, please check the planSlug",
        })
      }

      const planVersion = await opts.ctx.db.query.versions.findFirst({
        with: {
          subscriptions: {
            with: {
              customer: true,
            },
          },
        },
        where: (version, { eq, and }) =>
          and(
            eq(version.projectId, project.id),
            eq(version.planId, plan.id),
            eq(version.version, planVersionId)
          ),
      })

      return {
        subscriptions: planVersion?.subscriptions ?? [],
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
        const allFeaturesPlan = payload.version.featuresConfig ?? []
        const userHasFeature = allFeaturesPlan.some(
          (f) => f?.slug === featureSlug
        )

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

      if (!versionPlan?.featuresConfig) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Version not found in subscription or it has no features",
        })
      }

      const allFeaturesPlan = versionPlan.featuresConfig ?? []
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
        subscriptionData,
      }
    }),
})
