import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import {
  customerInsertBaseSchema,
  customerSelectSchema,
  searchDataParamsSchema,
} from "@builderai/db/validators"

import { createTRPCRouter, protectedActiveProjectProcedure } from "../../trpc"

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
})
