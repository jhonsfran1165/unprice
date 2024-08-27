import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { count, eq, getTableColumns, ilike, sql } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import {
  type ApiKey,
  createApiKeySchema,
  searchParamsSchemaDataTable,
  selectApiKeySchema,
} from "@unprice/db/validators"

import { hashStringSHA256, withDateFilters, withPagination } from "@unprice/db/utils"
import { createTRPCRouter, protectedProjectProcedure } from "../../trpc"

export const apiKeyRouter = createTRPCRouter({
  listByActiveProject: protectedProjectProcedure
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
    }),

  create: protectedProjectProcedure
    .input(createApiKeySchema)
    .output(
      z.object({
        apikey: selectApiKeySchema,
      })
    )
    .mutation(async (opts) => {
      const { name, expiresAt } = opts.input
      const project = opts.ctx.project

      const apiKeyId = utils.newId("apikey")

      // Generate the key
      const apiKey = utils.newId("apikey_key")
      // generate hash of the key
      const apiKeyHash = await hashStringSHA256(apiKey)

      const newApiKey = await opts.ctx.db
        .insert(schema.apikeys)
        .values({
          id: apiKeyId,
          name: name,
          key: apiKey,
          hash: apiKeyHash,
          expiresAt: expiresAt,
          projectId: project.id,
        })
        .returning()
        .then((res) => res[0])

      if (!newApiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create API key",
        })
      }

      return { apikey: newApiKey }
    }),

  revoke: protectedProjectProcedure
    .input(z.object({ ids: z.string().array() }))
    .output(z.object({ success: z.boolean(), numRevoked: z.number() }))
    .mutation(async (opts) => {
      const { ids } = opts.input
      const project = opts.ctx.project

      const result = await opts.ctx.db
        .update(schema.apikeys)
        .set({ revokedAt: Date.now(), updatedAtM: Date.now() })
        .where(
          sql`${schema.apikeys.id} in ${ids} AND ${schema.apikeys.projectId} = ${project.id} AND ${schema.apikeys.revokedAt} is NULL`
        )
        .returning()

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found you don't have access to this project",
        })
      }

      // remove from cache
      opts.ctx.waitUntil(
        Promise.all(result.map(async (apikey) => opts.ctx.cache.apiKeyByHash.remove(apikey.hash)))
      )

      return { success: true, numRevoked: result.length }
    }),

  roll: protectedProjectProcedure
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        apikey: selectApiKeySchema,
      })
    )
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const apiKey = await opts.ctx.db.query.apikeys.findFirst({
        where: (apikey, { eq, and }) => and(eq(apikey.id, id), eq(apikey.projectId, project.id)),
      })

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        })
      }

      // Generate a new key
      const newKey = utils.newId("apikey_key")
      // generate hash of the key
      const apiKeyHash = await hashStringSHA256(newKey)

      const newApiKey = await opts.ctx.db
        .update(schema.apikeys)
        .set({ key: newKey, updatedAtM: Date.now(), hash: apiKeyHash })
        .where(eq(schema.apikeys.id, opts.input.id))
        .returning()
        .then((res) => res[0])

      if (!newApiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to roll API key",
        })
      }

      // remove from cache
      opts.ctx.waitUntil(opts.ctx.cache.apiKeyByHash.remove(apiKey.hash))

      return { apikey: newApiKey }
    }),
})
