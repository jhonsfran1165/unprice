import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { eq, sql } from "@builderai/db"
import { apikey, createApiKeySchema } from "@builderai/db/schema/apikey"
import { newIdEdge } from "@builderai/db/utils"

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
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const apiKeys = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.apikey.findMany({
          where: (apikey, { eq }) => eq(apikey.projectId, project.id),
          orderBy: (apikey, { desc }) => [
            desc(apikey.revokedAt),
            desc(apikey.lastUsed),
            desc(apikey.expiresAt),
            desc(apikey.createdAt),
          ],
        })
      })

      return apiKeys
    }),

  createApiKey: protectedOrgProcedure
    .input(createApiKeySchema)
    .mutation(async (opts) => {
      const projectSlug = opts.input.projectSlug

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const apiKeyId = newIdEdge("apikey")

      // Generate the key
      const apiKey = newIdEdge("apikey_key")

      return await opts.ctx.db.insert(apikey).values({
        id: apiKeyId,
        name: opts.input.name,
        key: apiKey,
        expiresAt: opts.input.expiresAt,
        projectId: project.id,
        tenantId: opts.ctx.tenantId,
      })
    }),

  revokeApiKeys: protectedOrgAdminProcedure
    .input(z.object({ ids: z.string().array(), projectId: z.string() }))
    .mutation(async (opts) => {
      const { ids, projectId } = opts.input

      const result = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS
          .update(apikey)
          .set({ revokedAt: new Date() })
          .where(
            sql`${apikey.id} in ${ids} AND ${apikey.projectId} = ${projectId} AND ${apikey.revokedAt} is NULL`
          )
          .returning()
      })

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found you don't have access to this project",
        })
      }

      return { success: true, numRevoked: result.length }
    }),

  rollApiKey: protectedOrgAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts) => {
      const apiKey = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.apikey.findFirst({
          where: (apikey, { eq }) => eq(apikey.id, opts.input.id),
        })
      })

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        })
      }

      // Generate the key
      const newKey = newIdEdge("apikey_key")

      await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS
          .update(apikey)
          .set({ key: newKey })
          .where(eq(apikey.id, opts.input.id))
          .returning()
      })

      return newKey
    }),
})
