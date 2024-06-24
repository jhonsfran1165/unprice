import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { eq, sql } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import { createApiKeySchema, selectApiKeySchema } from "@builderai/db/validators"

import { createTRPCRouter, protectedActiveProjectProcedure } from "../../trpc"

export const apiKeyRouter = createTRPCRouter({
  listByActiveProject: protectedActiveProjectProcedure
    .input(
      z.object({
        fromDate: z.number().optional(),
        toDate: z.number().optional(),
      })
    )
    .output(
      z.object({
        apikeys: z.array(selectApiKeySchema),
      })
    )
    .query(async (opts) => {
      const { fromDate, toDate } = opts.input
      const project = opts.ctx.project

      const apikeys = await opts.ctx.db.query.apikeys.findMany({
        where: (apikey, { eq, and, between, gte, lte }) =>
          and(
            eq(apikey.projectId, project.id),
            fromDate && toDate
              ? between(apikey.createdAt, new Date(fromDate), new Date(toDate))
              : undefined,
            fromDate ? gte(apikey.createdAt, new Date(fromDate)) : undefined,
            toDate ? lte(apikey.createdAt, new Date(toDate)) : undefined
          ),
        orderBy: (apikey, { desc }) => [
          desc(apikey.revokedAt),
          desc(apikey.lastUsed),
          desc(apikey.expiresAt),
          desc(apikey.createdAt),
        ],
      })

      return { apikeys }
    }),

  create: protectedActiveProjectProcedure
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

      const newApiKey = await opts.ctx.db
        .insert(schema.apikeys)
        .values({
          id: apiKeyId,
          name: name,
          key: apiKey,
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

  revoke: protectedActiveProjectProcedure
    .input(z.object({ ids: z.string().array() }))
    .output(z.object({ success: z.boolean(), numRevoked: z.number() }))
    .mutation(async (opts) => {
      const { ids } = opts.input
      const project = opts.ctx.project

      const result = await opts.ctx.db
        .update(schema.apikeys)
        .set({ revokedAt: new Date(), updatedAt: new Date() })
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

      return { success: true, numRevoked: result.length }
    }),

  roll: protectedActiveProjectProcedure
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

      const newApiKey = await opts.ctx.db
        .update(schema.apikeys)
        .set({ key: newKey, updatedAt: new Date() })
        .where(eq(schema.apikeys.id, opts.input.id))
        .returning()
        .then((res) => res[0])

      if (!newApiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to roll API key",
        })
      }

      return { apikey: newApiKey }
    }),
})
