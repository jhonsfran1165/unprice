import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { eq, schema, sql, utils } from "@builderai/db"
import {
  createApiKeySchema,
  selectApiKeySchema,
} from "@builderai/validators/apikey"

import {
  createTRPCRouter,
  protectedOrgAdminProcedure,
  protectedOrgProcedure,
} from "../../trpc"
import { hasAccessToProject } from "../../utils"

export const apiKeyRouter = createTRPCRouter({
  listApiKeys: protectedOrgAdminProcedure
    .input(
      z.object({
        projectSlug: z.string(),
      })
    )
    .output(
      z.object({
        apikeys: z.array(selectApiKeySchema),
      })
    )
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const apikeys = await opts.ctx.db.query.apikeys.findMany({
        where: (apikey, { eq }) => eq(apikey.projectId, project.id),
        orderBy: (apikey, { desc }) => [
          desc(apikey.revokedAt),
          desc(apikey.lastUsed),
          desc(apikey.expiresAt),
          desc(apikey.createdAt),
        ],
      })

      return { apikeys }
    }),

  createApiKey: protectedOrgProcedure
    .input(createApiKeySchema)
    .output(
      z.object({
        apikey: selectApiKeySchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { projectSlug, name, expiresAt } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const apiKeyId = utils.newIdEdge("apikey")

      // Generate the key
      const apiKey = utils.newIdEdge("apikey_key")

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

      return { apikey: newApiKey?.[0] }
    }),

  revokeApiKeys: protectedOrgAdminProcedure
    .input(z.object({ ids: z.string().array(), projectId: z.string() }))
    .output(z.object({ success: z.boolean(), numRevoked: z.number() }))
    .mutation(async (opts) => {
      const { ids, projectId } = opts.input

      const { project } = await hasAccessToProject({
        projectId,
        ctx: opts.ctx,
      })

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

  rollApiKey: protectedOrgAdminProcedure
    .input(z.object({ id: z.string(), projectSlug: z.string() }))
    .output(
      z.object({
        apikey: selectApiKeySchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { id, projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const apiKey = await opts.ctx.db.query.apikeys.findFirst({
        where: (apikey, { eq, and }) =>
          and(eq(apikey.id, id), eq(apikey.projectId, project.id)),
      })

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        })
      }

      // Generate the key
      const newKey = utils.newIdEdge("apikey_key")

      const newApiKey = await opts.ctx.db
        .update(schema.apikeys)
        .set({ key: newKey })
        .where(eq(schema.apikeys.id, opts.input.id))
        .returning()

      return { apikey: newApiKey?.[0] }
    }),
})
