import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { eq, sql } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import {
  createApiKeySchema,
  selectApiKeySchema,
} from "@builderai/db/validators"

import {
  createTRPCRouter,
  protectedActiveWorkspaceAdminProcedure,
  protectedActiveWorkspaceProcedure,
} from "../../trpc"
import { projectGuard } from "../../utils"

export const apiKeyRouter = createTRPCRouter({
  listApiKeys: protectedActiveWorkspaceAdminProcedure
    .input(
      z.object({
        projectSlug: z.string(),
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
      const { projectSlug, fromDate, toDate } = opts.input

      const { project } = await projectGuard({
        projectSlug,
        ctx: opts.ctx,
      })

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

  createApiKey: protectedActiveWorkspaceProcedure
    .input(createApiKeySchema)
    .output(
      z.object({
        apikey: selectApiKeySchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { projectSlug, name, expiresAt } = opts.input
      const { workspaces, email } = opts.ctx.session.user

      const workspaceName = workspaces?.[0]?.slug ?? email

      if (!workspaceName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Workspace name is required",
        })
      }

      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "email is required",
        })
      }

      const { project } = await projectGuard({
        projectSlug,
        ctx: opts.ctx,
      })

      const apiKeyId = utils.newId("apikey")

      // Generate the key
      const apiKey = utils.newId("apikey_key")

      // TODO: change returning for .then((res) => res[0])
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

      return { apikey: newApiKey }
    }),

  revokeApiKeys: protectedActiveWorkspaceAdminProcedure
    .input(z.object({ ids: z.string().array(), projectSlug: z.string() }))
    .output(z.object({ success: z.boolean(), numRevoked: z.number() }))
    .mutation(async (opts) => {
      const { ids, projectSlug } = opts.input

      const { project } = await projectGuard({
        projectSlug,
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

  rollApiKey: protectedActiveWorkspaceAdminProcedure
    .input(z.object({ id: z.string(), projectSlug: z.string() }))
    .output(
      z.object({
        apikey: selectApiKeySchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { id, projectSlug } = opts.input

      const { project } = await projectGuard({
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
      const newKey = utils.newId("apikey_key")

      const newApiKey = await opts.ctx.db
        .update(schema.apikeys)
        .set({ key: newKey })
        .where(eq(schema.apikeys.id, opts.input.id))
        .returning()

      return { apikey: newApiKey?.[0] }
    }),
})
