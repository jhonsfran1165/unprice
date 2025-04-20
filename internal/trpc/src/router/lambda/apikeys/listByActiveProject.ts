import { count, eq, getTableColumns, ilike } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { withDateFilters, withPagination } from "@unprice/db/utils"
import {
  type ApiKey,
  searchParamsSchemaDataTable,
  selectApiKeySchema,
} from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const listByActiveProject = protectedProjectProcedure
  .input(searchParamsSchemaDataTable)
  .output(
    z.object({
      apikeys: z.array(selectApiKeySchema),
      pageCount: z.number(),
    })
  )
  .query(async (opts) => {
    const { page, page_size, search, from, to } = opts.input
    const project = opts.ctx.project
    const columns = getTableColumns(schema.apikeys)
    const filter = `%${search}%`

    try {
      const expressions = [
        // Filter by name
        search ? ilike(columns.name, filter) : undefined,
        project.id ? eq(columns.projectId, project.id) : undefined,
      ]

      // Transaction is used to ensure both queries are executed in a single transaction
      const { data, total } = await opts.ctx.db.transaction(async (tx) => {
        const query = tx.select().from(schema.apikeys).$dynamic()
        const whereQuery = withDateFilters<ApiKey>(expressions, columns.createdAtM, from, to)

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
          .from(schema.apikeys)
          .where(whereQuery)
          .execute()
          .then((res) => res[0]?.count ?? 0)

        return {
          data,
          total,
        }
      })

      const pageCount = Math.ceil(total / page_size)
      return { apikeys: data, pageCount }
    } catch (err: unknown) {
      console.error(err)
      return { apikeys: [], pageCount: 0 }
    }
  })
