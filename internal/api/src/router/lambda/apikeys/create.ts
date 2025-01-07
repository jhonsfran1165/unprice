import { TRPCError } from "@trpc/server"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { hashStringSHA256 } from "@unprice/db/utils"
import { createApiKeySchema, selectApiKeySchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const create = protectedProjectProcedure
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
      .catch((err) => {
        opts.ctx.logger.error(err)

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create API key",
        })
      })

    if (!newApiKey) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create API key",
      })
    }

    return { apikey: newApiKey }
  })
