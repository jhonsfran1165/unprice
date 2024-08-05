import { TRPCError } from "@trpc/server"
import { and, count, eq, getTableColumns, ilike, or } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import {
  type Customer,
  type FeatureType,
  customerInsertBaseSchema,
  customerSelectSchema,
  paymentProviderSchema,
  planSelectBaseSchema,
  planVersionSelectBaseSchema,
  searchParamsSchemaDataTable,
  subscriptionSelectSchema,
} from "@unprice/db/validators"
import { z } from "zod"

import { withDateFilters, withPagination } from "@unprice/db/utils"
import { deniedReasonSchema } from "../../pkg/errors"
import { StripePaymentProvider } from "../../pkg/payment-provider/stripe"
import { createTRPCRouter, protectedApiOrActiveProjectProcedure } from "../../trpc"
import { getEntitlements, reportUsageFeature, verifyFeature } from "../../utils/shared"

export const customersRouter = createTRPCRouter({
  create: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.create",
      openapi: {
        method: "POST",
        path: "/edge/customers.create",
        protect: true,
      },
    })
    .input(customerInsertBaseSchema)
    .output(z.object({ customer: customerSelectSchema }))
    .mutation(async (opts) => {
      const { description, name, email, metadata } = opts.input
      const { project } = opts.ctx

      // const unpriceCustomerId = project.workspace.unPriceCustomerId
      // const workspaceId = project.workspaceId

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

      // waitUntil(
      //   reportUsageFeature({
      //     customerId: unpriceCustomerId,
      //     featureSlug: "customers",
      //     projectId: project.id,
      //     workspaceId: workspaceId,
      //     ctx: ctx,
      //     usage: 1,
      //   })
      // )

      return {
        customer: customerData,
      }
    }),

  remove: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.remove",
      openapi: {
        method: "POST",
        path: "/edge/customers.remove",
        protect: true,
      },
    })
    .input(customerSelectSchema.pick({ id: true }))
    .output(z.object({ customer: customerSelectSchema }))
    .mutation(async (opts) => {
      const { id } = opts.input
      const { project } = opts.ctx

      // const unpriceCustomerId = project.workspace.unPriceCustomerId
      // const workspaceId = project.workspaceId

      // we just need to validate the entitlements
      // await entitlementGuard({
      //   project,
      //   featureSlug: "customers",
      //   ctx,
      // })

      const deletedCustomer = await opts.ctx.db
        .delete(schema.customers)
        .where(and(eq(schema.customers.projectId, project.id), eq(schema.customers.id, id)))
        .returning()
        .then((re) => re[0])

      if (!deletedCustomer) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting customer",
        })
      }

      // waitUntil(
      //   reportUsageFeature({
      //     customerId: unpriceCustomerId,
      //     featureSlug: "customers",
      //     projectId: project.id,
      //     workspaceId: workspaceId,
      //     ctx: ctx,
      //     usage: -1,
      //   })
      // )

      return {
        customer: deletedCustomer,
      }
    }),
  update: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.update",
      openapi: {
        method: "POST",
        path: "/edge/customers.update",
        protect: true,
      },
    })
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
      const { project } = opts.ctx

      // we just need to validate the entitlements
      // await entitlementGuard({
      //   project,
      //   featureSlug: "customers",
      //   ctx,
      // })

      const customerData = await opts.ctx.db.query.customers.findFirst({
        where: (feature, { eq, and }) => and(eq(feature.id, id), eq(feature.projectId, project.id)),
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
        .where(and(eq(schema.customers.id, id), eq(schema.customers.projectId, project.id)))
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

  listPaymentMethods: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.listPaymentMethods",
      openapi: {
        method: "GET",
        path: "/edge/customers.listPaymentMethods",
        protect: true,
      },
    })
    .input(
      z.object({
        customerId: z.string(),
        provider: paymentProviderSchema,
      })
    )
    .output(
      z.object({
        paymentMethods: z
          .object({
            id: z.string(),
            name: z.string().nullable(),
            last4: z.string().optional(),
            expMonth: z.number().optional(),
            expYear: z.number().optional(),
            brand: z.string().optional(),
          })
          .array(),
      })
    )
    .query(async (opts) => {
      const { customerId, provider } = opts.input
      const project = opts.ctx.project

      const customerData = await opts.ctx.db.query.customers.findFirst({
        where: (customer, { and, eq }) =>
          and(eq(customer.id, customerId), eq(customer.projectId, project.id)),
      })

      if (!customerData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Customer not found",
        })
      }

      // there is not information about the payment methods in our database
      // we have to query the payment provider api to get up-to-date information

      switch (provider) {
        case "stripe": {
          if (!customerData.stripeCustomerId) {
            return {
              paymentMethods: [],
            }
          }

          const stripePaymentProvider = new StripePaymentProvider({
            paymentCustomerId: customerData.stripeCustomerId,
            logger: opts.ctx.logger,
          })

          const { err, val } = await stripePaymentProvider.listPaymentMethods({
            limit: 5,
          })

          if (err ?? !val) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: err.message,
            })
          }

          return {
            paymentMethods: val,
          }
        }
        default:
          return {
            paymentMethods: [],
          }
      }
    }),

  createPaymentMethod: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.createPaymentMethod",
      openapi: {
        method: "POST",
        path: "/edge/customers.createPaymentMethod",
        protect: true,
      },
    })
    .input(
      z.object({
        paymentProvider: paymentProviderSchema,
        customerId: z.string(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .output(z.object({ success: z.boolean(), url: z.string() }))
    .mutation(async (opts) => {
      const project = opts.ctx.project
      const { successUrl, cancelUrl, customerId } = opts.input

      const customerData = await opts.ctx.db.query.customers.findFirst({
        where: (customer, { and, eq }) =>
          and(eq(customer.id, customerId), eq(customer.projectId, project.id)),
      })

      if (!customerData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Customer not found",
        })
      }

      switch (opts.input.paymentProvider) {
        case "stripe": {
          const stripePaymentProvider = new StripePaymentProvider({
            paymentCustomerId: customerData.stripeCustomerId,
            logger: opts.ctx.logger,
          })

          const { err, val } = await stripePaymentProvider.createSession({
            customerId: customerId,
            projectId: project.id,
            email: customerData.email,
            successUrl: successUrl,
            cancelUrl: cancelUrl,
            currency: project.defaultCurrency,
          })

          if (err ?? !val) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Error creating session",
            })
          }

          return val
        }
        default:
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment provider not supported yet",
          })
      }
    }),

  // is it a mutation because we need to call it from the client async
  exist: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.exist",
      openapi: {
        method: "POST",
        path: "/edge/customers.exist",
        protect: true,
      },
    })
    .input(customerSelectSchema.pick({ email: true }))
    .output(z.object({ exist: z.boolean() }))
    .mutation(async (opts) => {
      const { email } = opts.input
      const { project } = opts.ctx

      // we just need to validate the entitlements
      // await entitlementGuard({
      //   project,
      //   featureSlug: "customers",
      //   ctx,
      // })

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
  // is it a mutation because we need to call it from the client async
  getByEmail: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.getByEmail",
      openapi: {
        method: "GET",
        path: "/edge/customers.getByEmail",
        protect: true,
      },
    })
    .input(customerSelectSchema.pick({ email: true }))
    .output(z.object({ customer: customerSelectSchema }))
    .query(async (opts) => {
      const { email } = opts.input

      // const { apiKey, project, ...ctx } = opts.ctx
      const { project } = opts.ctx

      // we just need to validate the entitlements
      // await entitlementGuard({
      //   project,
      //   featureSlug: "customers",
      //   ctx,
      // })

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
  getById: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.getById",
      openapi: {
        method: "GET",
        path: "/edge/customers.getById",
        protect: true,
      },
    })
    .input(customerSelectSchema.pick({ id: true }))
    .output(z.object({ customer: customerSelectSchema }))
    .query(async (opts) => {
      const { id } = opts.input
      const { project } = opts.ctx

      // we just need to validate the entitlements
      // await entitlementGuard({
      //   project,
      //   featureSlug: "customers",
      //   ctx,
      // })

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

  getSubscriptions: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.getSubscriptions",
      openapi: {
        method: "GET",
        path: "/edge/customers.getSubscriptions",
        protect: true,
      },
    })
    .input(customerSelectSchema.pick({ id: true }))
    .output(
      z.object({
        customer: customerSelectSchema.extend({
          subscriptions: subscriptionSelectSchema
            .extend({
              planVersion: planVersionSelectBaseSchema.extend({
                plan: planSelectBaseSchema,
              }),
            })
            .array(),
        }),
      })
    )
    .query(async (opts) => {
      const { id } = opts.input
      const { project } = opts.ctx

      // we just need to validate the entitlements
      // await entitlementGuard({
      //   project,
      //   featureSlug: "customers",
      //   ctx,
      // })

      console.log(id, project.id)

      const customerData = await opts.ctx.db.query.customers.findFirst({
        with: {
          subscriptions: {
            with: {
              planVersion: {
                with: {
                  plan: true,
                },
              },
            },
          },
        },
        where: (customer, { eq, and }) =>
          and(eq(customer.projectId, project.id), eq(customer.id, id)),
      })

      console.log(customerData)

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
  listByActiveProject: protectedApiOrActiveProjectProcedure
    .input(searchParamsSchemaDataTable)
    .output(z.object({ customers: z.array(customerSelectSchema), pageCount: z.number() }))
    .query(async (opts) => {
      const { page, page_size, search, from, to } = opts.input
      const { project } = opts.ctx
      const columns = getTableColumns(schema.customers)
      const filter = `%${search}%`

      // we just need to validate the entitlements
      // await entitlementGuard({
      //   project,
      //   featureSlug: "customers",
      //   ctx,
      // })

      try {
        const expressions = [
          // Filter by name or email if search is provided
          search ? or(ilike(columns.name, filter), ilike(columns.email, filter)) : undefined,
          // Filter by project
          eq(columns.projectId, project.id),
        ]

        // Transaction is used to ensure both queries are executed in a single transaction
        const { data, total } = await opts.ctx.db.transaction(async (tx) => {
          const query = tx.select().from(schema.customers).$dynamic()
          const whereQuery = withDateFilters<Customer>(expressions, columns.createdAt, from, to)

          const data = await withPagination(
            query,
            whereQuery,
            [
              {
                column: columns.createdAt,
                order: "desc",
              },
            ],
            page,
            page_size
          )

          const total = await tx
            .select({
              count: count(),
            })
            .from(schema.customers)
            .where(whereQuery)
            .execute()
            .then((res) => res[0]?.count ?? 0)

          return {
            data,
            total,
          }
        })

        const pageCount = Math.ceil(total / page_size)
        return { customers: data, pageCount }
      } catch (err: unknown) {
        console.error(err)
        return { customers: [], pageCount: 0 }
      }
    }),

  // encodeURIComponent(JSON.stringify({ 0: { json:{ customerId: "cus_2GGH1GE4864s4GrX6ttkjbStDP3k" }}}))
  entitlements: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.entitlements",
      openapi: {
        method: "GET",
        path: "/edge/customers.entitlements",
        protect: true,
      },
    })
    .input(
      z.object({
        customerId: z.string(),
      })
    )
    .output(
      z.object({
        entitlements: z.string().array(),
      })
    )
    .query(async (opts) => {
      const { customerId } = opts.input
      const { apiKey, ...ctx } = opts.ctx
      const projectId = apiKey.projectId

      const res = await getEntitlements({
        customerId,
        projectId: projectId,
        ctx,
      })

      return {
        entitlements: res,
      }
    }),
  // encodeURIComponent(JSON.stringify({ 0: { json:{ customerId: "cus_6hASRQKH7vsq5WQH", featureSlug: "access" }}}))
  can: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.can",
      openapi: {
        method: "GET",
        path: "/edge/customers.can",
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
        access: z.boolean(),
        deniedReason: deniedReasonSchema.optional(),
        currentUsage: z.number().optional(),
        limit: z.number().optional(),
        featureType: z.custom<FeatureType>().optional(),
      })
    )
    .query(async (opts) => {
      const { customerId, featureSlug } = opts.input
      const { apiKey, ...ctx } = opts.ctx
      const projectId = apiKey.projectId

      return await verifyFeature({
        customerId,
        featureSlug,
        projectId: projectId,
        ctx,
      })
    }),
  // encodeURIComponent(JSON.stringify({ 0: { json:{ customerId: "cus_UR25SSERij9HFMoU", featureSlug: "apikeys", usage: 100, idempotenceKey: "123"}}}))
  reportUsage: protectedApiOrActiveProjectProcedure
    .meta({
      span: "customers.reportUsage",
      openapi: {
        method: "GET",
        path: "/edge/customers.reportUsage",
        protect: true,
      },
    })
    .input(
      z.object({
        customerId: z.string(),
        featureSlug: z.string(),
        usage: z.number(),
        idempotenceKey: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .query(async (opts) => {
      const { customerId, featureSlug, usage, idempotenceKey } = opts.input

      // this is to avoid reporting the same usage multiple times
      const body = JSON.stringify({ customerId, featureSlug, usage, idempotenceKey })
      const hashKey = await utils.hashStringSHA256(body)

      // get result if it exists
      const result = await opts.ctx.cache.idempotentRequestUsageByHash.get(hashKey)

      if (result.val) {
        return {
          success: result.val,
        }
      }

      // if cache miss, report usage
      const { apiKey, ...ctx } = opts.ctx
      const projectId = apiKey.projectId
      const workspaceId = apiKey.project.workspaceId

      const response = await reportUsageFeature({
        customerId,
        featureSlug,
        projectId: projectId,
        workspaceId: workspaceId,
        usage: usage,
        ctx,
      })

      ctx.waitUntil(opts.ctx.cache.idempotentRequestUsageByHash.set(hashKey, response.success))

      return {
        success: response.success,
      }
    }),
})
