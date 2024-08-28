import { TRPCError } from "@trpc/server"
import { type Database, and, desc, eq, getTableColumns } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { customerSelectSchema, subscriptionExtendedWithItemsSchema } from "@unprice/db/validators"
import { z } from "zod"
import { buildItemsBySubscriptionIdQuery } from "../../../queries/subscriptions"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

export const getSubscriptions = protectedApiOrActiveProjectProcedure
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
        subscriptions: subscriptionExtendedWithItemsSchema.array(),
      }),
    })
  )
  .query(async (opts) => {
    const { id } = opts.input
    const { project } = opts.ctx
    const versionColumns = getTableColumns(schema.versions)

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

    const items = await buildItemsBySubscriptionIdQuery({
      db: opts.ctx.db as Database,
    })

    const customerWithSubscriptions = await opts.ctx.db
      .with(items)
      .select({
        subscriptions: schema.subscriptions,
        version: versionColumns,
        items: items.items,
      })
      .from(schema.subscriptions)
      .leftJoin(
        items,
        and(
          eq(items.subscriptionId, schema.subscriptions.id),
          eq(items.projectId, schema.subscriptions.projectId)
        )
      )
      .innerJoin(
        schema.customers,
        and(
          eq(schema.subscriptions.customerId, schema.customers.id),
          eq(schema.customers.projectId, schema.subscriptions.projectId)
        )
      )
      .innerJoin(
        schema.versions,
        and(
          eq(schema.subscriptions.planVersionId, schema.versions.id),
          eq(schema.customers.projectId, schema.versions.projectId),
          eq(schema.versions.projectId, project.id)
        )
      )
      .where(and(eq(schema.customers.id, id), eq(schema.customers.projectId, project.id)))
      .orderBy(() => [desc(schema.subscriptions.createdAtM)])

    if (!customerWithSubscriptions || !customerWithSubscriptions.length) {
      return {
        customer: {
          ...customerData,
          subscriptions: [],
        },
      }
    }

    const subscriptions = customerWithSubscriptions.map((data) => {
      return {
        ...data.subscriptions,
        version: data.version,
        customer: customerData,
        items: data.items,
      }
    })

    return {
      customer: {
        ...customerData,
        subscriptions: subscriptions,
      },
    }
  })
