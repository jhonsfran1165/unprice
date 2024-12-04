import { count, eq, getTableColumns, ilike, or } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import {
  type Customer,
  customerSelectSchema,
  searchParamsSchemaDataTable,
} from "@unprice/db/validators"
import { z } from "zod"

import { withDateFilters, withPagination } from "@unprice/db/utils"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

export const listByActiveProject = protectedApiOrActiveProjectProcedure
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
        // Filter isMain not true
        eq(columns.isMain, false),
      ]

      // Transaction is used to ensure both queries are executed in a single transaction
      const { data, total } = await opts.ctx.db.transaction(async (tx) => {
        const query = tx.select().from(schema.customers).$dynamic()
        const whereQuery = withDateFilters<Customer>(expressions, columns.createdAtM, from, to)

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
  })
