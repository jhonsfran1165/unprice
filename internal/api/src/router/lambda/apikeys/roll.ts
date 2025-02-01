import { TRPCError } from "@trpc/server"
import { hashStringSHA256, newId } from "@unprice/db/utils"
import { selectApiKeySchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"

export const roll = protectedProjectProcedure
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      apikey: selectApiKeySchema,
    })
  )
  .mutation(async (opts) => {
    const { id } = opts.input
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
    const newKey = newId("apikey_key")
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
  })
