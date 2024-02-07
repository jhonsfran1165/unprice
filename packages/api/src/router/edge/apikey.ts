import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { eq, schema, sql, utils } from "@builderai/db"
import { createApiKeySchema } from "@builderai/validators/apikey"

import {
  createTRPCRouter,
  protectedApiProcedure,
  protectedOrgAdminProcedure,
  protectedOrgProcedure,
} from "../../trpc"
import { hasAccessToProject } from "../../utils"

export const apiKeyRouter = createTRPCRouter({
  testing: protectedApiProcedure.query(async (opts) => {
    const data = opts.ctx.apiKey

    const project = await opts.ctx.db.query.project.findMany({
      where: (project, { eq }) => eq(project.id, data.projectId),
    })

    return project
  }),
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

      const apiKeyId = utils.newIdEdge("apikey")

      // Generate the key
      const apiKey = utils.newIdEdge("apikey_key")

      return await opts.ctx.db
        .insert(schema.apikey)
        .values({
          id: apiKeyId,
          name: opts.input.name,
          key: apiKey,
          expiresAt: opts.input.expiresAt,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
        })
        .returning()
    }),

  revokeApiKeys: protectedOrgAdminProcedure
    .input(z.object({ ids: z.string().array(), projectId: z.string() }))
    .mutation(async (opts) => {
      const { ids, projectId } = opts.input

      const result = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS
          .update(schema.apikey)
          .set({ revokedAt: new Date() })
          .where(
            sql`${schema.apikey.id} in ${ids} AND ${schema.apikey.projectId} = ${projectId} AND ${schema.apikey.revokedAt} is NULL`
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
      const newKey = utils.newIdEdge("apikey_key")

      await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS
          .update(schema.apikey)
          .set({ key: newKey })
          .where(eq(schema.apikey.id, opts.input.id))
          .returning()
      })

      return newKey
    }),
})
