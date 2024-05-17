import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import type {
  PlanVersionExtended,
  SubscriptionExtended,
} from "@builderai/db/validators"
import {
  customerInsertBaseSchema,
  customerSelectSchema,
  searchDataParamsSchema,
} from "@builderai/db/validators"

import { UnPriceApiError } from "../../pkg/errors"
import {
  createTRPCRouter,
  protectedActiveProjectProcedure,
  protectedApiProcedure,
} from "../../trpc"
import { getActiveSubscriptions } from "../../utils"

export const customersRouter = createTRPCRouter({
  create: protectedActiveProjectProcedure
    .input(customerInsertBaseSchema)
    .output(z.object({ customer: customerSelectSchema }))
    .mutation(async (opts) => {
      const { description, name, email, metadata } = opts.input
      const project = opts.ctx.project

      const customerId = utils.newId("customer")

      const customerData = await opts.ctx.db
        .insert(schema.customers)
        .values({
          id: customerId,
          name,
          email,
          projectId: project.id,
          description,
          ...(metadata && { metadata }),
        })
        .returning()
        .then((data) => data[0])

      if (!customerData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating customer",
        })
      }

      return {
        customer: customerData,
      }
    }),

  remove: protectedActiveProjectProcedure
    .input(customerSelectSchema.pick({ id: true }))
    .output(z.object({ customer: customerSelectSchema }))
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
        .then((re) => re[0])

      if (!deletedCustomer) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting customer",
        })
      }

      return {
        customer: deletedCustomer,
      }
    }),
  update: protectedActiveProjectProcedure
    .input(
      customerSelectSchema
        .pick({
          id: true,
          name: true,
          description: true,
          email: true,
          metadata: true,
        })
        .partial({
          description: true,
          metadata: true,
        })
    )
    .output(z.object({ customer: customerSelectSchema }))
    .mutation(async (opts) => {
      const { email, id, description, metadata, name } = opts.input
      const project = opts.ctx.project

      const customerData = await opts.ctx.db.query.customers.findFirst({
        where: (feature, { eq, and }) =>
          and(eq(feature.id, id), eq(feature.projectId, project.id)),
      })

      if (!customerData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        })
      }

      const updatedCustomer = await opts.ctx.db
        .update(schema.customers)
        .set({
          ...(email && { email }),
          ...(description && { description }),
          ...(name && { name }),
          ...(metadata && {
            metadata: {
              ...customerData.metadata,
              ...metadata,
            },
          }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.customers.id, id),
            eq(schema.customers.projectId, project.id)
          )
        )
        .returning()
        .then((data) => data[0])

      if (!updatedCustomer) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating customer",
        })
      }

      return {
        customer: updatedCustomer,
      }
    }),
  exist: protectedActiveProjectProcedure
    .input(customerSelectSchema.pick({ email: true }))
    .output(z.object({ exist: z.boolean() }))
    .mutation(async (opts) => {
      const { email } = opts.input
      const project = opts.ctx.project

      const customerData = await opts.ctx.db.query.customers.findFirst({
        columns: {
          id: true,
        },
        where: (customer, { eq, and }) =>
          and(eq(customer.projectId, project.id), eq(customer.email, email)),
      })

      return {
        exist: !!customerData,
      }
    }),
  getByEmail: protectedActiveProjectProcedure
    .input(customerSelectSchema.pick({ email: true }))
    .output(z.object({ customer: customerSelectSchema }))
    .mutation(async (opts) => {
      const { email } = opts.input
      const project = opts.ctx.project

      const customerData = await opts.ctx.db.query.customers.findFirst({
        where: (customer, { eq, and }) =>
          and(eq(customer.projectId, project.id), eq(customer.email, email)),
      })

      if (!customerData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        })
      }

      return {
        customer: customerData,
      }
    }),
  getById: protectedActiveProjectProcedure
    .input(customerSelectSchema.pick({ id: true }))
    .output(z.object({ customer: customerSelectSchema }))
    .query(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const customerData = await opts.ctx.db.query.customers.findFirst({
        where: (customer, { eq, and }) =>
          and(eq(customer.projectId, project.id), eq(customer.id, id)),
      })

      if (!customerData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        })
      }

      return {
        customer: customerData,
      }
    }),

  listByActiveProject: protectedActiveProjectProcedure
    .input(searchDataParamsSchema)
    .output(z.object({ customers: z.array(customerSelectSchema) }))
    .query(async (opts) => {
      const { fromDate, toDate } = opts.input
      const project = opts.ctx.project

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

  // encodeURIComponent(JSON.stringify({ 0: { json:{ customerId: "cus_6hASRQKH7vsq5WQH", featureSlug: "access" }}}))
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
        // TODO: this should be an enum
        deniedReason: z.string().optional(),
      })
    )
    .query(async (opts) => {
      const { customerId, featureSlug } = opts.input
      const apiKey = opts.ctx.apiKey
      const projectId = apiKey.projectId
      const analytics = opts.ctx.analytics

      // basic data from the request
      const ip = opts.ctx.headers.get("x-real-ip") ?? ""
      const userAgent = opts.ctx.headers.get("user-agent") ?? ""

      // TODO: add metrics so I know how long this takes, for now save it into the analytics
      const start = performance.now()

      // find if there is a plan already saved in redis
      const redisId = `app:${projectId}:customer:${customerId}`

      const cachedActiveSubs = await getActiveSubscriptions(redisId)
      let activeSubs = []

      if (cachedActiveSubs.length > 0) {
        activeSubs = cachedActiveSubs
      } else {
        const customer = await opts.ctx.db.query.customers.findFirst({
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
            and(eq(customer.id, customerId), eq(customer.projectId, projectId)),
        })

        if (!customer || customer?.subscriptions.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer have no active subscriptions",
          })
        }

        activeSubs = customer.subscriptions
      }

      // check if the user has access to the feature in one of the active subscriptions
      // get the subscription and the feature
      const { subscription, feature } = activeSubs.reduce(
        (acc, sub) => {
          const planFeature = sub.planVersion.planFeatures.find(
            (pf) => pf.feature.slug === featureSlug
          )

          if (planFeature) {
            acc.feature = planFeature
            acc.subscription = sub
          }

          return acc
        },
        {
          subscription: undefined as SubscriptionExtended | undefined,
          // disable autoformat for this line
          // prettier-ignore
          feature: undefined as Pick<PlanVersionExtended, "planFeatures">["planFeatures"][number] | undefined,
        }
      )

      try {
        // if the subscription is not active here means that after billing the subscription was canceled
        // TODO: we could check the current status here or somehow keep updated the cache because the billing process happens once per day
        // TODO: add a different status for canceled subscriptions
        if (!subscription || subscription.status !== "active") {
          throw new UnPriceApiError({
            code: "SUBSCRIPTION_EXPIRED",
            message: "Subscription not found",
          })
        }

        if (!feature) {
          throw new UnPriceApiError({
            code: "NOT_FOUND",
            message: "Feature not found",
          })
        }

        // TODO: add wait until here - update nextjs

        // TODO: is it true for the rest of the types?
        // TODO: support limits for metered features
        if (feature.featureType === "usage") {
          // we have to check the usage of the feature from tinybird
          //TODO: for now lest just call tinybird api directly, but later on we could check the usage from the cache
          // so that means we check the cache usage and then revalidate the usage from tinybird in background with waitUntil
        } else {
          // just return the userHasFeature
        }

        // TODO: save report usage to analytics - use tinybird from analitycs package
        // TODO: remember in tynibird you separate mutable data from immutable data
        // TODO: presign url from tinybird to upload usage data from the client?

        // TODO: get this data https://nextjs.org/docs/app/api-reference/functions/userAgent
      } catch (error) {
        let deniedReason = ""
        if (error instanceof UnPriceApiError) {
          deniedReason = error.code
        } else {
          deniedReason = "INTERNAL_SERVER_ERROR"
        }

        if (feature && subscription) {
          // report verification to analytics only if the feature and subscription are found
          // TODO: report usage to analytics as well
          await analytics.ingestFeaturesVerification({
            featureId: feature.featureId,
            planVersionFeatureId: feature.id,
            workspaceId: projectId,
            planVersionId: subscription.planVersionId,
            deniedReason:
              error instanceof UnPriceApiError
                ? error.code
                : "INTERNAL_SERVER_ERROR",
            customerId,
            subscriptionId: subscription.id,
            projectId,
            time: Date.now(),
            ipAddress: ip,
            userAgent: userAgent,
            latency: performance.now() - start,
          })
        }

        return {
          userHasFeature: false,
          deniedReason,
        }
      }
    }),
})
