import { type Database, and, count, eq, getTableColumns } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { withDateFilters, withPagination } from "@unprice/db/utils"
import {
  type Subscription,
  searchParamsSchemaDataTable,
  subscriptionExtendedWithItemsSchema,
} from "@unprice/db/validators"
import { z } from "zod"
import { buildItemsBySubscriptionIdQuery } from "../../../queries/subscriptions"
import { protectedProjectProcedure } from "../../../trpc"

export const listByActiveProject = protectedProjectProcedure
  .input(searchParamsSchemaDataTable)
  .output(
    z.object({
      subscriptions: subscriptionExtendedWithItemsSchema.array(),
      pageCount: z.number(),
    })
  )
  .query(async (opts) => {
    const { page, page_size, from, to } = opts.input
    const project = opts.ctx.project
    const columns = getTableColumns(schema.subscriptions)
    const customerColumns = getTableColumns(schema.customers)
    const versionColumns = getTableColumns(schema.versions)

    try {
      const expressions = [
        // Filter by project
        eq(columns.projectId, project.id),
      ]

      const items = await buildItemsBySubscriptionIdQuery({
        db: opts.ctx.db as Database,
      })

      // Transaction is used to ensure both queries are executed in a single transaction
      const { data, total } = await opts.ctx.db.transaction(async (tx) => {
        const query = tx
          .with(items)
          .select({
            subscriptions: schema.subscriptions,
            customer: customerColumns,
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
            version: data.version,
            items: data.items,
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
      console.error(err)
      return { subscriptions: [], pageCount: 0 }
    }
  })
