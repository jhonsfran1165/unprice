import { TRPCError } from "@trpc/server"
import { waitUntil } from "@vercel/functions"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import {
  customerInsertBaseSchema,
  customerSelectSchema,
  deniedReasonSchema,
  reportUsageErrorSchema,
  searchDataParamsSchema,
} from "@builderai/db/validators"

import {
  createTRPCRouter,
  protectedActiveProjectProcedure,
  protectedApiProcedure,
} from "../../trpc"
import { reportUsageFeature, verifyFeature } from "../../utils/features"
import { unprice } from "../../utils/unprice"
import {
  UnPriceApiError,
  UnPriceReportUsageError,
  UnPriceVerificationError,
} from "./../../pkg/errors"

export const customersRouter = createTRPCRouter({
  // TODO: create should support apikeys as well
  create: protectedActiveProjectProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/edge/customers.create",
        protect: true,
      },
    })
    .input(customerInsertBaseSchema)
    .output(z.object({ customer: customerSelectSchema }))
    .mutation(async (opts) => {
      const { description, name, email, metadata } = opts.input
      const project = opts.ctx.project
      const workspaceId = project.workspaceId

      const customerId = utils.newId("customer")

      // TODO: find the best way to use my product to create my own product
      const data = await unprice.customers.can({
        customerId: workspaceId,
        featureSlug: "customers",
      })

      if (data?.result?.deniedReason) {
        throw new TRPCError({
          code: "CONFLICT",
          message: data?.result.deniedReason,
        })
      }

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

      waitUntil(
        unprice.customers.reportUsage({
          customerId: workspaceId,
          featureSlug: "customers",
          usage: 1,
        })
      )

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
        userHasFeature: z.boolean(),
        deniedReason: deniedReasonSchema.optional(),
        currentUsage: z.number().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async (opts) => {
      const { customerId, featureSlug } = opts.input
      const { apiKey, ...ctx } = opts.ctx
      const projectId = apiKey.projectId

      try {
        const { currentUsage, limit } = await verifyFeature({
          customerId,
          featureSlug,
          projectId: projectId,
          workspaceId: apiKey.project.workspaceId,
          ctx,
        })

        return {
          userHasFeature: true,
          currentUsage: currentUsage,
          limit: limit,
        }
      } catch (error) {
        console.error("Error verifying feature", error)

        if (error instanceof UnPriceVerificationError) {
          return {
            userHasFeature: false,
            deniedReason: error.code,
            currentUsage: error.currentUsage,
            limit: error.limit,
          }
        } else if (error instanceof UnPriceApiError) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: error.code,
          })
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error verifying feature",
          })
        }
      }
    }),
  // encodeURIComponent(JSON.stringify({ 0: { json:{ customerId: "cus_6hASRQKH7vsq5WQH", featureSlug: "access", usage: 10}}}))
  reportUsage: protectedApiProcedure
    .meta({
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
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: deniedReasonSchema.or(reportUsageErrorSchema).optional(),
      })
    )
    .query(async (opts) => {
      const { customerId, featureSlug, usage } = opts.input
      const { apiKey, ...ctx } = opts.ctx
      const projectId = apiKey.projectId
      const workspaceId = apiKey.project.workspaceId

      try {
        const { success } = await reportUsageFeature({
          customerId,
          featureSlug,
          projectId: projectId,
          workspaceId: workspaceId,
          usage: usage,
          ctx,
        })

        return {
          success: success,
        }
      } catch (error) {
        if (error instanceof UnPriceApiError) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: error.code,
          })
        } else if (error instanceof UnPriceReportUsageError) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: error.code,
          })
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error reporting usage for feature",
          })
        }
      }
    }),
})
