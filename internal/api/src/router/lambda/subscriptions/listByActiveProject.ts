import { TRPCError } from "@trpc/server"
import { and, count, eq, getTableColumns } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { withDateFilters, withPagination } from "@unprice/db/utils"
import {
  type Subscription,
  customerSelectSchema,
  searchParamsSchemaDataTable,
  subscriptionSelectSchema,
} from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const listByActiveProject = protectedProjectProcedure
  .input(searchParamsSchemaDataTable)
  .output(
    z.object({
      subscriptions: subscriptionSelectSchema
        .extend({
          customer: customerSelectSchema,
        })
        .array(),
      pageCount: z.number(),
    })
  )
  .query(async (opts) => {
    const { page, page_size, from, to } = opts.input
    const project = opts.ctx.project
    const columns = getTableColumns(schema.subscriptions)
    const customerColumns = getTableColumns(schema.customers)

    try {
      const expressions = [
        // Filter by project
        eq(columns.projectId, project.id),
      ]

      // Transaction is used to ensure both queries are executed in a single transaction
      const { data, total } = await opts.ctx.db.transaction(async (tx) => {
        const query = tx
          .select({
            subscriptions: schema.subscriptions,
            customer: customerColumns,
          })
          .from(schema.subscriptions)
          .innerJoin(
            schema.customers,
            and(
              eq(schema.subscriptions.customerId, schema.customers.id),
              eq(schema.customers.projectId, schema.subscriptions.projectId)
            )
          )
          .$dynamic()

        const whereQuery = withDateFilters<Subscription>(expressions, columns.createdAtM, from, to)

        const data = await withPagination(
          query,
          whereQuery,
          [
            {
              column: columns.createdAtM,
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
          .from(schema.subscriptions)
          .where(whereQuery)
          .execute()
          .then((res) => res[0]?.count ?? 0)

        const subscriptions = data.map((data) => {
          return {
            ...data.subscriptions,
            customer: data.customer,
          }
        })

        return {
          data: subscriptions,
          total,
        }
      })

      const pageCount = Math.ceil(total / page_size)
      return { subscriptions: data, pageCount }
    } catch (err: unknown) {
      opts.ctx.logger.error("Error listing subscriptions", {
        error: JSON.stringify(err),
      })

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "There was an error listing subscriptions. Contact support.",
      })
    }
  })
