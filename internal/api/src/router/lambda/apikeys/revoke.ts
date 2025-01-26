import { TRPCError } from "@trpc/server"
import { sql } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const revoke = protectedProjectProcedure
  .input(z.object({ ids: z.string().array() }))
  .output(z.object({ success: z.boolean(), numRevoked: z.number() }))
  .mutation(async (opts) => {
    const { ids } = opts.input
    const project = opts.ctx.project
    const customerId = project.workspace.unPriceCustomerId
    const featureSlug = "apikeys"

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: project.workspace.isInternal,
      throwOnNoAccess: false,
    })

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
  })
